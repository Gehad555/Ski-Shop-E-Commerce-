using SkiShop.Core.Entities.OrderAggregate;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SkiShop.Core.Interfaces
{
    public interface IOrderService
    {
        Task<Order?> CreateOrderFromCart(string cartId, ShippingAddress shippingAddress,
      PaymentSummary paymentSummary, string buyerEmail,
      (string PaymentIntentId, long AmountInCents)? verifiedPayment = null);
    }
}
