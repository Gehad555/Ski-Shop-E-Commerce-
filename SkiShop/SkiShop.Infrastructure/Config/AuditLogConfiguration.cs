using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SkiShop.Core.Entities;

namespace SkiShop.Infrastructure.Config;

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.Property(x => x.Action).HasMaxLength(50).IsRequired();
        builder.Property(x => x.EntityName).HasMaxLength(100).IsRequired();
        builder.Property(x => x.EntityId).HasMaxLength(100);
        builder.Property(x => x.UserEmail).HasMaxLength(256);
        builder.Property(x => x.UserId).HasMaxLength(128);
        builder.Property(x => x.IpAddress).HasMaxLength(64);
        builder.Property(x => x.Timestamp).HasConversion(
            x => x.ToUniversalTime(),
            x => DateTime.SpecifyKind(x, DateTimeKind.Utc)
        );

        builder.HasIndex(x => x.Timestamp);
        builder.HasIndex(x => x.EntityName);
        builder.HasIndex(x => x.Action);
        builder.HasIndex(x => x.UserEmail);
    }
}
