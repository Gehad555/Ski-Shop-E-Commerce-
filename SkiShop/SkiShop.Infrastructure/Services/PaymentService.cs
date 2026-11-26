using Microsoft.Extensions.Configuration;
using SkiShop.Core.Entities;
using SkiShop.Core.Interfaces;
using Stripe;
using System;
using System.Threading.Tasks;
using Product = SkiShop.Core.Entities.Product;

namespace SkiShop.Infrastructure.Services;

public class PaymentService(IConfiguration config, ICartService cartService,
    IUnitOfWork unit, ICouponService couponService) : IPaymentService
{
    public async Task<AppShoppingCart?> CreateOrUpdatePaymentIntent(string cartId)
    {
        StripeConfiguration.ApiKey = config["StripeSettings:SecretKey"];

        var cart = await cartService.GetCartAsync(cartId);

        if (cart == null) return null;

        var shippingPrice = await GetShippingPriceAsync(cart) ?? 0;

        await ValidateCartItemsInCartAsync(cart);

        var subtotal = (long)cart.Items.Sum(i => i.Quantity * (i.Price * 100));

        if (cart.Coupon != null)
        {
            subtotal -= await couponService.CalculateDiscountFromSubtotal(cart.Coupon, subtotal);
        }

        var service = new PaymentIntentService();

        if (string.IsNullOrEmpty(cart.PaymentIntentId))
        {
            var options = new PaymentIntentCreateOptions
            {
                Amount = subtotal + shippingPrice,
                Currency = "usd",
                AllowedPaymentMethodTypes = ["card"],
                Metadata = new Dictionary<string, string> { { "cartId", cart.Id } }
            };
            var intent = await service.CreateAsync(options);
            cart.PaymentIntentId = intent.Id;
            cart.ClientSecret = intent.ClientSecret;
        }
        else
        {
            var options = new PaymentIntentUpdateOptions
            {
                Amount = subtotal + shippingPrice,
            };
            await service.UpdateAsync(cart.PaymentIntentId, options);
        }

        await cartService.SetCartAsync(cart);

        return cart;
    }

    private async Task ValidateCartItemsInCartAsync(AppShoppingCart cart)
    {
        foreach (var item in cart.Items)
        {
            var productItem = await unit.Repository<Product>().GetByIdAsync(item.ProductId)
                ?? throw new Exception("Unable to validate cart items");

            if (item.Price != productItem.Price)
            {
                item.Price = productItem.Price;
            }
        }
    }

    private async Task<long?> GetShippingPriceAsync(AppShoppingCart cart)
    {
        if (cart.DeliveryMethodId.HasValue)
        {
            var deliveryMethod = await unit.Repository<DeliveryMethod>().GetByIdAsync((int)cart.DeliveryMethodId);

            if (deliveryMethod == null) return null;

            return (long)(deliveryMethod.Price * 100);
        }

        return null;
    }
}
