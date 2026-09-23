using SkiShop.Core.Entities;
using System.Text.Json;

namespace SkiShop.Infrastructure.Data
{
    public class StoreContextSeed
    {
        public static async Task SeedAsync(StoreContext context)
        {
            if (!context.Products.Any())
            {
                var path = Path.Combine(AppContext.BaseDirectory, "Data", "SeedData", "products.json");
                var productsData = await File.ReadAllTextAsync(path);

                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var products = JsonSerializer.Deserialize<List<Product>>(productsData, options);

                if (products == null) return;

                context.Products.AddRange(products);
                await context.SaveChangesAsync();
            }
        }
    }
}
