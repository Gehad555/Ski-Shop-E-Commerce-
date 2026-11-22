using Microsoft.EntityFrameworkCore;
using SkiShop.Core.Entities;
using System;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace SkiShop.Infrastructure.Config
{
    public class DeliveryMethodConfiguration : IEntityTypeConfiguration<DeliveryMethod>
    {
        public void Configure(EntityTypeBuilder<DeliveryMethod> builder)
        {
            builder.Property(x => x.Price).HasColumnType("decimal(18,2)");
        }

    }
}
