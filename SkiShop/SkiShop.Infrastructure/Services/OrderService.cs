using SkiShop.Core.Entities;
using Core.Interfaces;
using Core.Specifications;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using SkiShop.Core.Entities;
using SkiShop.Core.Entities.OrderAggregate;
using SkiShop.Core.Interfaces;
using SkiShop.Core.Specifications;
using Stripe;
using System;

namespace SkiShop.Infrastructure.Services;

public class OrderService(ICartService cartService, IUnitOfWork unit, IConfiguration config)
    : IOrderService
{
    public async Task<Order?> CreateOrderFromCart(string cartId,
        ShippingAddress shippingAddress, PaymentSummary paymentSummary,
        string buyerEmail, (string PaymentIntentId, long AmountInCents)? verifiedPayment = null)
    {
        if (verifiedPayment != null)
        {
            var existingOrder = await unit.Repository<Order>()
                .GetEntityWithSpec(new OrderSpecification(
                    verifiedPayment.Value.PaymentIntentId, isPaymentIntent: true));

            if (existingOrder != null) return existingOrder;
        }

        var cart = await cartService.GetCartAsync(cartId);

        if (cart?.PaymentIntentId == null || cart.DeliveryMethodId == null)
            return null;

        var paidAmountInCents = verifiedPayment?.AmountInCents
            ?? await GetSucceededAmount(cart.PaymentIntentId);

        var items = new List<OrderItem>();

        foreach (var item in cart.Items)
        {
            var productItem = await unit.Repository<SkiShop.Core.Entities.Product>().GetByIdAsync(item.ProductId);

            if (productItem == null) return null;

            var itemOrdered = new ProductItemOrdered
            {
                ProductId = item.ProductId,
                ProductName = productItem.Name,
                PictureUrl = productItem.PictureUrl
            };

            var orderItem = new OrderItem
            {
                ItemOrdered = itemOrdered,
                Price = productItem.Price,
                Quantity = item.Quantity
            };
            items.Add(orderItem);
        }

        var deliveryMethod = await unit.Repository<DeliveryMethod>()
            .GetByIdAsync((int)cart.DeliveryMethodId);

        if (deliveryMethod == null) return null;

        var expectedAmount = (long)items.Sum(x => x.Quantity * (x.Price * 100))
            + (long)deliveryMethod.Price * 100;

        if (expectedAmount != paidAmountInCents) return null;

        var order = new Order
        {
            OrderItems = items,
            DeliveryMethod = deliveryMethod,
            ShippingAddress = shippingAddress,
            Subtotal = items.Sum(x => x.Price * x.Quantity),
            PaymentSummary = paymentSummary,
            PaymentIntentId = cart.PaymentIntentId,
            BuyerEmail = buyerEmail,
            Status = OrderStatus.PaymentReceived
        };

        unit.Repository<Order>().Add(order);

        try
        {
            await unit.Complete();
            await cartService.DeleteCartAsync(cartId);
            return order;
        }
        catch (DbUpdateException)
        {
            return await unit.Repository<Order>().GetEntityWithSpec(
                new OrderSpecification(cart.PaymentIntentId, isPaymentIntent: true));
        }
    }

    private async Task<long?> GetSucceededAmount(string paymentIntentId)
    {
        StripeConfiguration.ApiKey = config["StripeSettings:SecretKey"];

        var intent = await new PaymentIntentService().GetAsync(paymentIntentId);

        return intent.Status == "succeeded" ? intent.Amount : null;
    }
}