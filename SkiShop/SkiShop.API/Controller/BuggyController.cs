using API.Controllers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SkiShop.API.DTOs;
using System.Security.Claims;

namespace SkiShop.API.Controller
{
    public class BuggyController : BaseApiController
    {
        [HttpGet("Unauthorized")]
        public IActionResult GetUnauthorized()
        {
            return Unauthorized();
        }
        [HttpGet("badrequest")]
        public IActionResult GetBadRequest()
        {
            return BadRequest("This is not a good request");
        }

        [HttpGet("notfound")]
        public IActionResult GetNotFound()
        {
            return NotFound();
        }

        [HttpGet("internalerror")]
        public IActionResult GetInternalError()
        {
            throw new Exception("This is a test exception");
        }

        [HttpPost("validationerror")]
        public IActionResult GetValidationError(CreateProductDto product)
        {
            return Ok();
        }

        [Authorize]
        [HttpGet("secret")]

        public IActionResult GetSecret()
        {
            var name = User.FindFirst(ClaimTypes.Name)?.Value;

            var id = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            return Ok("Hello " + name + " with the id of " + id);

        }


    }
}
