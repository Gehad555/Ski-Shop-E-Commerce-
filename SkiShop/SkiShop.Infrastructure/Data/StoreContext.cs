using Infrastructure.Config;
using Microsoft.EntityFrameworkCore;
using SkiShop.Core.Entities;

namespace SkiShop.Infrastructure.Data
{
    public class StoreContext(DbContextOptions options) : DbContext(options)
    {
       public DbSet<Product> Products { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {

            base.OnModelCreating(modelBuilder);

            modelBuilder.ApplyConfigurationsFromAssembly(typeof(ProductConfiguration).Assembly);

        }
    }
}




















































