using API.Controllers;
using Microsoft.AspNetCore.Mvc;
using SkiShop.API.DTOs;

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


    }
}
