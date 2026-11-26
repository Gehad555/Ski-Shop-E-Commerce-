using Microsoft.AspNetCore.Identity;
using SkiShop.Core.Entities;
using System.Text.Json;

namespace SkiShop.Infrastructure.Data
{
    public class StoreContextSeed
    {
        public static async Task SeedAsync(StoreContext context, UserManager<AppUser> userManager)
        {
            if (!userManager.Users.Any(x => x.UserName == "admin@test.com"))
            {
                var user = new AppUser
                {
                    UserName = "admin@test.com",
                    Email = "admin@test.com"
                };

                await userManager.CreateAsync(user, "Pa$$w0rd");
                await userManager.AddToRoleAsync(user, "Admin");
            }

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
            if (!context.DeliveryMethods.Any())
            {
                var dmPath = Path.Combine(AppContext.BaseDirectory, "Data", "SeedData", "delivery.json");
                var dmData = await File.ReadAllTextAsync(dmPath);

                var options2 = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var methods = JsonSerializer.Deserialize<List<DeliveryMethod>>(dmData, options2);

                if (methods == null) return;

                context.DeliveryMethods.AddRange(methods);

                await context.SaveChangesAsync();
            }




        }
    }
}
