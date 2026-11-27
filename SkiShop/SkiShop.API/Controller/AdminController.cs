using API.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SkiShop.API.DTOs;
using SkiShop.API.Extensions;
using SkiShop.API.RequestHelpers;
using SkiShop.Core.Entities;
using SkiShop.Core.Entities.OrderAggregate;
using SkiShop.Core.Interfaces;
using SkiShop.Core.Specifications;
using SkiShop.Infrastructure.Data;

namespace SkiShop.API.Controller;

[Authorize(Roles = "Admin")]
public class AdminController(
    IUnitOfWork unit,
    IPaymentService paymentService,
    StoreContext context) : BaseApiController
{
    [HttpGet("orders")]
    public async Task<ActionResult<IReadOnlyList<OrderDto>>> GetOrders([FromQuery] OrderSpecParams specParams)
    {
        var spec = new OrderSpecification(specParams);

        return await CreatePagedResult(unit.Repository<Order>(), spec, specParams.PageIndex,
            specParams.PageSize, o => o.ToDto());
    }

    [HttpGet("orders/{id:int}")]
    public async Task<ActionResult<OrderDto>> GetOrderById(int id)
    {
        var spec = new OrderSpecification(id);

        var order = await unit.Repository<Order>().GetEntityWithSpec(spec);

        if (order == null) return BadRequest("No order with that Id");

        return order.ToDto();
    }

    [HttpPost("orders/refund/{id:int}")]
    public async Task<ActionResult<OrderDto>> RefundOrder(int id)
    {
        var spec = new OrderSpecification(id);

        var order = await unit.Repository<Order>().GetEntityWithSpec(spec);

        if (order == null) return BadRequest("No order with that id");

        if (order.Status == OrderStatus.Pending)
            return BadRequest("Payment not received for this order");

        var result = await paymentService.RefundPayment(order.PaymentIntentId);

        if (result == "succeeded")
        {
            order.Status = OrderStatus.Refunded;

            await unit.Complete();

            return order.ToDto();
        }

        return BadRequest("Problem refunding order");
    }

    [HttpGet("logs")]
    public async Task<ActionResult<Pagination<SystemLog>>> GetSystemLogs([FromQuery] SystemLogQueryParams queryParams)
    {
        var query = context.SystemLogs.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(queryParams.Level))
        {
            var level = queryParams.Level.Trim();
            query = query.Where(x => x.Level == level);
        }

        if (!string.IsNullOrWhiteSpace(queryParams.Source))
        {
            var source = queryParams.Source.Trim();
            query = query.Where(x => x.Source == source);
        }

        if (queryParams.StatusCode.HasValue)
        {
            query = query.Where(x => x.StatusCode == queryParams.StatusCode.Value);
        }

        if (queryParams.From.HasValue)
        {
            var fromUtc = NormalizeUtc(queryParams.From.Value);
            query = query.Where(x => x.Timestamp >= fromUtc);
        }

        if (queryParams.To.HasValue)
        {
            var toUtc = NormalizeUtc(queryParams.To.Value);
            query = query.Where(x => x.Timestamp <= toUtc);
        }

        if (!string.IsNullOrWhiteSpace(queryParams.Search))
        {
            var pattern = $"%{queryParams.Search.Trim()}%";
            query = query.Where(x =>
                EF.Functions.ILike(x.Message, pattern) ||
                (x.RequestPath != null && EF.Functions.ILike(x.RequestPath, pattern)) ||
                (x.UserEmail != null && EF.Functions.ILike(x.UserEmail, pattern)) ||
                (x.Exception != null && EF.Functions.ILike(x.Exception, pattern)) ||
                EF.Functions.ILike(x.Source, pattern) ||
                (x.TraceId != null && EF.Functions.ILike(x.TraceId, pattern)));
        }

        var pageIndex = Math.Max(1, queryParams.PageIndex);
        var pageSize = Math.Clamp(queryParams.PageSize, 1, 50);

        var totalItems = await query.CountAsync();
        var items = await query
            .OrderByDescending(x => x.Timestamp)
            .ThenByDescending(x => x.Id)
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new Pagination<SystemLog>(pageIndex, pageSize, totalItems, items));
    }

    [HttpGet("audit")]
    public async Task<ActionResult<Pagination<AuditLog>>> GetAuditLogs([FromQuery] AuditLogQueryParams queryParams)
    {
        var query = context.AuditLogs.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(queryParams.Action))
        {
            var action = queryParams.Action.Trim();
            query = query.Where(x => x.Action == action);
        }

        if (!string.IsNullOrWhiteSpace(queryParams.EntityName))
        {
            var entityName = queryParams.EntityName.Trim();
            query = query.Where(x => x.EntityName == entityName);
        }

        if (queryParams.From.HasValue)
        {
            var fromUtc = NormalizeUtc(queryParams.From.Value);
            query = query.Where(x => x.Timestamp >= fromUtc);
        }

        if (queryParams.To.HasValue)
        {
            var toUtc = NormalizeUtc(queryParams.To.Value);
            query = query.Where(x => x.Timestamp <= toUtc);
        }

        if (!string.IsNullOrWhiteSpace(queryParams.Search))
        {
            var pattern = $"%{queryParams.Search.Trim()}%";
            query = query.Where(x =>
                (x.Details != null && EF.Functions.ILike(x.Details, pattern)) ||
                (x.UserEmail != null && EF.Functions.ILike(x.UserEmail, pattern)) ||
                EF.Functions.ILike(x.EntityName, pattern) ||
                (x.EntityId != null && EF.Functions.ILike(x.EntityId, pattern)) ||
                EF.Functions.ILike(x.Action, pattern) ||
                (x.AffectedColumns != null && EF.Functions.ILike(x.AffectedColumns, pattern)) ||
                (x.IpAddress != null && EF.Functions.ILike(x.IpAddress, pattern)));
        }

        var pageIndex = Math.Max(1, queryParams.PageIndex);
        var pageSize = Math.Clamp(queryParams.PageSize, 1, 50);

        var totalItems = await query.CountAsync();
        var items = await query
            .OrderByDescending(x => x.Timestamp)
            .ThenByDescending(x => x.Id)
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new Pagination<AuditLog>(pageIndex, pageSize, totalItems, items));
    }

    [HttpGet("logs/stats")]
    public async Task<ActionResult<LogStatsDto>> GetLogStats()
    {
        var last24h = DateTime.UtcNow.AddHours(-24);

        var totalSystemLogs = await context.SystemLogs.CountAsync();
        var errorCount = await context.SystemLogs.CountAsync(x => x.Level == "Error");
        var warningCount = await context.SystemLogs.CountAsync(x => x.Level == "Warning");
        var infoCount = await context.SystemLogs.CountAsync(x => x.Level == "Information");

        var totalAuditLogs = await context.AuditLogs.CountAsync();
        var auditLast24Hours = await context.AuditLogs.CountAsync(x => x.Timestamp >= last24h);

        var auditActions = await context.AuditLogs
            .Select(x => x.Action)
            .Distinct()
            .OrderBy(x => x)
            .ToListAsync();

        var auditEntities = await context.AuditLogs
            .Select(x => x.EntityName)
            .Distinct()
            .OrderBy(x => x)
            .ToListAsync();

        var logLevels = await context.SystemLogs
            .Select(x => x.Level)
            .Distinct()
            .OrderBy(x => x)
            .ToListAsync();

        var logSources = await context.SystemLogs
            .Select(x => x.Source)
            .Distinct()
            .OrderBy(x => x)
            .ToListAsync();

        return Ok(new LogStatsDto
        {
            TotalSystemLogs = totalSystemLogs,
            ErrorCount = errorCount,
            WarningCount = warningCount,
            InfoCount = infoCount,
            TotalAuditLogs = totalAuditLogs,
            AuditLast24Hours = auditLast24Hours,
            AuditActions = auditActions,
            AuditEntities = auditEntities,
            LogLevels = logLevels,
            LogSources = logSources
        });
    }

    private static DateTime NormalizeUtc(DateTime dt) =>
        dt.Kind == DateTimeKind.Unspecified
            ? DateTime.SpecifyKind(dt, DateTimeKind.Utc)
            : dt.ToUniversalTime();
}
