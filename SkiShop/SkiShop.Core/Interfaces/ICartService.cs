using SkiShop.Core.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SkiShop.Core.Interfaces
{
    public interface ICartService
    {
        Task<AppShoppingCart?> GetCartAsync(string key) ;
        Task<AppShoppingCart?> SetCartAsync(AppShoppingCart cart);
        Task<bool> DeleteCartAsync(string key);
    }
}
