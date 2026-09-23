using SkiShop.Core.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SkiShop.Core.Specifications
{
    public class BrandListSpecification : BaseSpecification<Product,string>
    {
        public BrandListSpecification() : base()
        {
            AddSelect(p => p.Brand);
        }
    }
}
