using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SkiShop.Core.Entities.OrderAggregate;


namespace SkiShop.Infrastructure.Config
{
    public class OrderConfiguration : IEntityTypeConfiguration<Order>
    {
        public void Configure(EntityTypeBuilder<Order> builder)
        {
            builder.OwnsOne(x => x.ShippingAddress, o => o.WithOwner());
            builder.OwnsOne(x => x.PaymentSummary, o => o.WithOwner());
            builder.HasIndex(x => x.PaymentIntentId).IsUnique();
            builder.Property(x => x.Status).HasConversion(
                o => o.ToString(),
                o => Enum.Parse<OrderStatus>(o)
            );
            builder.Property(x => x.Subtotal).HasColumnType("decimal(18,2)");
            builder.HasMany(x => x.OrderItems).WithOne().OnDelete(DeleteBehavior.Cascade);
            builder.Property(x => x.OrderDate).HasConversion(
                x => x.ToUniversalTime(),
                x => DateTime.SpecifyKind(x, DateTimeKind.Utc)
            );
        }
    }
    }
