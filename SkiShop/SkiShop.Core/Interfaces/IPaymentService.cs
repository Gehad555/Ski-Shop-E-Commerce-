using SkiShop.Core.Entities;

namespace SkiShop.Core.Interfaces;

public interface IPaymentService
{
    Task<AppShoppingCart?> CreateOrUpdatePaymentIntent(string cartId);
}