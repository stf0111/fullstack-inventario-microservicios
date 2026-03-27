using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microservicio.Transacciones.Api.DTOs.AjusteStock;
using Microservicio.Transacciones.Api.Interfaces;

namespace Microservicio.Transacciones.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AjusteStockController : ControllerBase
{
    private readonly IAjusteStockService _ajusteStockService;

    public AjusteStockController(IAjusteStockService ajusteStockService)
    {
        _ajusteStockService = ajusteStockService;
    }

    [HttpPost("{prodId:int}")]
    public async Task<IActionResult> Ajustar(int prodId, [FromBody] AjusteStockRequestDto dto)
    {
        try
        {
            var response = await _ajusteStockService.AjustarAsync(prodId, dto);
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new
            {
                mensaje = ex.Message
            });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new
            {
                mensaje = ex.Message
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                mensaje = $"Error interno al ajustar stock: {ex.Message}"
            });
        }
    }
}