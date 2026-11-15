using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SkiShop.Core.Entities
{
    public class AppShoppingCart
    {
        public required string Id { get; set; }
        public List<CartItem> Items { get; set; } = [];
    }
}
