using System.Runtime.CompilerServices;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;
using SkiShop.Core.Entities;
using SkiShop.Core.Entities.OrderAggregate;
using SkiShop.Core.Interfaces;

namespace SkiShop.Infrastructure.Data;

public class AuditSaveChangesInterceptor(ICurrentUserService currentUserService) : SaveChangesInterceptor
{
    private static readonly HashSet<string> AuditMetadataColumns =
    [
        nameof(BaseEntity.Id),
        nameof(BaseEntity.CreatedAt),
        nameof(BaseEntity.CreatedBy),
        nameof(BaseEntity.UpdatedAt),
        nameof(BaseEntity.UpdatedBy)
    ];

    private readonly ConditionalWeakTable<DbContext, List<PendingAuditEntry>> _pendingAudits = new();

    public override InterceptionResult<int> SavingChanges(
        DbContextEventData eventData,
        InterceptionResult<int> result)
    {
        if (eventData.Context != null)
        {
            PrepareAuditEntriesAsync(eventData.Context, CancellationToken.None).GetAwaiter().GetResult();
        }
        return base.SavingChanges(eventData, result);
    }

    public override async ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        if (eventData.Context != null)
        {
            await PrepareAuditEntriesAsync(eventData.Context, cancellationToken);
        }
        return await base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    public override int SavedChanges(SaveChangesCompletedEventData eventData, int result)
    {
        if (eventData.Context != null)
        {
            PersistAuditEntriesAsync(eventData.Context, CancellationToken.None).GetAwaiter().GetResult();
        }
        return base.SavedChanges(eventData, result);
    }

    public override async ValueTask<int> SavedChangesAsync(
        SaveChangesCompletedEventData eventData,
        int result,
        CancellationToken cancellationToken = default)
    {
        if (eventData.Context != null)
        {
            await PersistAuditEntriesAsync(eventData.Context, cancellationToken);
        }
        return await base.SavedChangesAsync(eventData, result, cancellationToken);
    }

    public override void SaveChangesFailed(DbContextErrorEventData eventData)
    {
        if (eventData.Context != null)
        {
            _pendingAudits.Remove(eventData.Context);
        }
        base.SaveChangesFailed(eventData);
    }

    public override Task SaveChangesFailedAsync(
        DbContextErrorEventData eventData,
        CancellationToken cancellationToken = default)
    {
        if (eventData.Context != null)
        {
            _pendingAudits.Remove(eventData.Context);
        }
        return base.SaveChangesFailedAsync(eventData, cancellationToken);
    }

    private async Task PrepareAuditEntriesAsync(DbContext context, CancellationToken cancellationToken)
    {
        context.ChangeTracker.DetectChanges();

        var now = DateTime.UtcNow;
        var pending = new List<PendingAuditEntry>();

        foreach (var entry in context.ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State is not (EntityState.Added or EntityState.Modified or EntityState.Deleted))
            {
                continue;
            }

            var actor = ResolveActor(entry.Entity);

            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = now;
                entry.Entity.CreatedBy = actor;
                entry.Entity.UpdatedAt = null;
                entry.Entity.UpdatedBy = null;

                var newValues = ExtractValues(entry.Properties, p => p.CurrentValue, skipAuditColumns: true);

                pending.Add(new PendingAuditEntry
                {
                    Entry = entry,
                    EntityName = entry.Entity.GetType().Name,
                    Action = "Created",
                    UserEmail = actor,
                    UserId = currentUserService.UserId,
                    IpAddress = currentUserService.IpAddress,
                    NewValues = newValues,
                    Timestamp = now
                });
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Property(nameof(BaseEntity.CreatedAt)).IsModified = false;
                entry.Property(nameof(BaseEntity.CreatedBy)).IsModified = false;
                entry.Entity.UpdatedAt = now;
                entry.Entity.UpdatedBy = actor;

                var dbValues = await entry.GetDatabaseValuesAsync(cancellationToken);
                var oldValues = new Dictionary<string, object?>();
                var newValues = new Dictionary<string, object?>();
                var affectedColumns = new List<string>();

                foreach (var prop in entry.Properties)
                {
                    var name = prop.Metadata.Name;
                    if (AuditMetadataColumns.Contains(name) || prop.Metadata.IsForeignKey())
                    {
                        continue;
                    }

                    var oldVal = dbValues != null ? dbValues[name] : prop.OriginalValue;
                    var newVal = prop.CurrentValue;

                    if (!ValuesEqual(oldVal, newVal))
                    {
                        oldValues[name] = oldVal;
                        newValues[name] = newVal;
                        affectedColumns.Add(name);
                    }
                }

                if (affectedColumns.Count == 0)
                {
                    continue;
                }

                var action = "Updated";
                if (entry.Entity is Order order &&
                    oldValues.TryGetValue(nameof(Order.Status), out var prevStatus) &&
                    !Equals(prevStatus?.ToString(), OrderStatus.Refunded.ToString()) &&
                    order.Status == OrderStatus.Refunded)
                {
                    action = "Refunded";
                }

                pending.Add(new PendingAuditEntry
                {
                    Entry = entry,
                    EntityName = entry.Entity.GetType().Name,
                    Action = action,
                    UserEmail = actor,
                    UserId = currentUserService.UserId,
                    IpAddress = currentUserService.IpAddress,
                    OldValues = oldValues,
                    NewValues = newValues,
                    AffectedColumns = affectedColumns,
                    Timestamp = now
                });
            }
            else if (entry.State == EntityState.Deleted)
            {
                var oldValues = ExtractValues(entry.Properties, p => p.OriginalValue, skipAuditColumns: true);

                pending.Add(new PendingAuditEntry
                {
                    Entry = entry,
                    EntityName = entry.Entity.GetType().Name,
                    Action = "Deleted",
                    UserEmail = actor,
                    UserId = currentUserService.UserId,
                    IpAddress = currentUserService.IpAddress,
                    OldValues = oldValues,
                    Timestamp = now
                });
            }
        }

        if (pending.Count > 0)
        {
            _pendingAudits.Remove(context);
            _pendingAudits.Add(context, pending);
        }
    }

    private async Task PersistAuditEntriesAsync(DbContext context, CancellationToken cancellationToken)
    {
        if (!_pendingAudits.TryGetValue(context, out var pending) || pending.Count == 0)
        {
            return;
        }

        _pendingAudits.Remove(context);

        var auditLogs = pending.Select(item =>
        {
            var entityId = item.Entry.Entity.Id.ToString();
            return new AuditLog
            {
                Action = item.Action,
                EntityName = item.EntityName,
                EntityId = entityId,
                UserEmail = item.UserEmail,
                UserId = item.UserId,
                IpAddress = item.IpAddress,
                OldValues = item.OldValues is { Count: > 0 } ? JsonSerializer.Serialize(item.OldValues) : null,
                NewValues = item.NewValues is { Count: > 0 } ? JsonSerializer.Serialize(item.NewValues) : null,
                AffectedColumns = item.AffectedColumns is { Count: > 0 } ? string.Join(", ", item.AffectedColumns) : null,
                Details = BuildDetails(item.Action, item.EntityName, entityId, item.Entry.Entity),
                Timestamp = item.Timestamp
            };
        }).ToList();

        context.Set<AuditLog>().AddRange(auditLogs);
        await context.SaveChangesAsync(cancellationToken);
    }

    private string ResolveActor(BaseEntity entity)
    {
        if (!string.IsNullOrWhiteSpace(currentUserService.UserEmail))
        {
            return currentUserService.UserEmail;
        }

        if (entity is Order order && !string.IsNullOrWhiteSpace(order.BuyerEmail))
        {
            return order.BuyerEmail;
        }

        return "System";
    }

    private static Dictionary<string, object?> ExtractValues(
        IEnumerable<PropertyEntry> properties,
        Func<PropertyEntry, object?> selector,
        bool skipAuditColumns)
    {
        var dict = new Dictionary<string, object?>();
        foreach (var prop in properties)
        {
            var name = prop.Metadata.Name;
            if (skipAuditColumns && AuditMetadataColumns.Contains(name))
            {
                continue;
            }
            dict[name] = selector(prop);
        }
        return dict;
    }

    private static bool ValuesEqual(object? left, object? right)
    {
        if (Equals(left, right)) return true;
        if (left is decimal d1 && right is decimal d2) return d1 == d2;
        if (left is Enum || right is Enum) return string.Equals(left?.ToString(), right?.ToString(), StringComparison.Ordinal);
        return false;
    }

    private static string BuildDetails(string action, string entityName, string entityId, BaseEntity entity)
    {
        return entity switch
        {
            Product p => $"{action} product \"{p.Name}\" (#{entityId})",
            Order o => $"{action} order #{entityId} for {o.BuyerEmail} ({o.Status})",
            OrderItem oi => $"{action} order item \"{oi.ItemOrdered.ProductName}\" (x{oi.Quantity})",
            DeliveryMethod d => $"{action} delivery method \"{d.ShortName}\" (#{entityId})",
            _ => $"{action} {entityName} #{entityId}"
        };
    }

    private sealed class PendingAuditEntry
    {
        public required EntityEntry<BaseEntity> Entry { get; init; }
        public required string EntityName { get; init; }
        public required string Action { get; init; }
        public string? UserEmail { get; init; }
        public string? UserId { get; init; }
        public string? IpAddress { get; init; }
        public Dictionary<string, object?>? OldValues { get; init; }
        public Dictionary<string, object?>? NewValues { get; init; }
        public List<string>? AffectedColumns { get; init; }
        public DateTime Timestamp { get; init; }
    }
}
