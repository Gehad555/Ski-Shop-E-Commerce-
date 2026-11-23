using Core.Interfaces;
using Core.Specifications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkiShop.API.DTOs;
using SkiShop.API.Extensions;
using SkiShop.Core.Entities.OrderAggregate;
using SkiShop.Core.Interfaces;
using SkiShop.Core.Specifications;
using System;

namespace API.Controllers;

[Authorize]
public class OrdersController(IOrderService orderService, IUnitOfWork unit) : BaseApiController
{
    [HttpPost]
    public async Task<ActionResult<Order>> CreateOrder(CreateOrderDto orderDto)
    {
        var email = User.GetEmail();

        var order = await orderService.CreateOrderFromCart(orderDto.CartId,
            orderDto.ShippingAddress, orderDto.PaymentSummary, email);

        if (order == null)
            return BadRequest("Problem creating order - your card has been charged. Contact customer service");

        return order;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<OrderDto>>> GetOrdersForUser()
    {
        var spec = new OrderSpecification(User.GetEmail());

        var orders = await unit.Repository<Order>().ListAsync(spec);

        var ordersToReturn = orders.Select(o => o.ToDto()).ToList();

        return Ok(ordersToReturn);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<OrderDto>> GetOrderById(int id)
    {
        var spec = new OrderSpecification(User.GetEmail(), id);

        var order = await unit.Repository<Order>().GetEntityWithSpec(spec);

        if (order == null) return NotFound();

        return order.ToDto();
    }
}