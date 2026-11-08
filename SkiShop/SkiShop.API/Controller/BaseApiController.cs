
using Core.Interfaces;
using Microsoft.AspNetCore.Mvc;
using SkiShop.API.RequestHelpers;
using SkiShop.Core.Entities;
using SkiShop.Core.Interfaces;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BaseApiController : ControllerBase
{
    protected async Task<ActionResult> CreatePagedResult<T>(IGenericRepository<T> repository,
        ISpecification<T> specification, int pageIndex, int pageSize) where T : BaseEntity
    {
        var items = await repository.ListAsync(specification);
        var totalItems = await repository.CountAsync(specification);
        var pagination = new Pagination<T>(pageIndex, pageSize, totalItems, items);
        return Ok(pagination);
    }
}