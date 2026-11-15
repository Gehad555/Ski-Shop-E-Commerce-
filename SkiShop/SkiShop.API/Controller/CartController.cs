using API.Controllers;
using Microsoft.AspNetCore.Mvc;
using SkiShop.Core.Entities;
using SkiShop.Core.Interfaces;

namespace SkiShop.API.Controller
{
    public class CartController(ICartService cartService) : BaseApiController
    {


        [HttpGet]
        public async Task<ActionResult<AppShoppingCart>> GetCartById(string id)
        {
            var cart = await cartService.GetCartAsync(id);
          
            return Ok(cart ?? new AppShoppingCart { Id = id });
        }

        [HttpPost]
        public async Task<ActionResult<AppShoppingCart>> UpdateCart(AppShoppingCart cart)
        {
            var updatedCart = await cartService.SetCartAsync(cart);
            if (updatedCart == null) return BadRequest("Problem with cart");
            return Ok(updatedCart);
        }

        [HttpDelete]
        public async Task<ActionResult> DeleteCart(string id)
        {
            var result = await cartService.DeleteCartAsync(id);
            if (!result) return BadRequest("Problem deleting cart");
            return Ok();
        }

    }
}
