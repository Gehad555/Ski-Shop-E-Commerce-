using Infrastructure.Config;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SkiShop.Core.Entities;

namespace SkiShop.Infrastructure.Data
{
    public class StoreContext(DbContextOptions options) :IdentityDbContext<AppUser>(options)
    {
       public DbSet<Product> Products { get; set; }

        public DbSet<Address> Addresss { get; set; }

        public DbSet<DeliveryMethod> DeliveryMethods { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {

            base.OnModelCreating(modelBuilder);

            modelBuilder.ApplyConfigurationsFromAssembly(typeof(ProductConfiguration).Assembly);

        }
    }
}




















































