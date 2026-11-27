using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SkiShop.Core.Entities;

namespace SkiShop.Infrastructure.Config;

public class SystemLogConfiguration : IEntityTypeConfiguration<SystemLog>
{
    public void Configure(EntityTypeBuilder<SystemLog> builder)
    {
        builder.Property(x => x.Level).HasMaxLength(32).IsRequired();
        builder.Property(x => x.Source).HasMaxLength(100).IsRequired();
        builder.Property(x => x.RequestMethod).HasMaxLength(16);
        builder.Property(x => x.RequestPath).HasMaxLength(500);
        builder.Property(x => x.UserEmail).HasMaxLength(256);
        builder.Property(x => x.IpAddress).HasMaxLength(64);
        builder.Property(x => x.TraceId).HasMaxLength(128);
        builder.Property(x => x.Timestamp).HasConversion(
            x => x.ToUniversalTime(),
            x => DateTime.SpecifyKind(x, DateTimeKind.Utc)
        );

        builder.HasIndex(x => x.Timestamp);
        builder.HasIndex(x => x.Level);
        builder.HasIndex(x => x.StatusCode);
    }
}
