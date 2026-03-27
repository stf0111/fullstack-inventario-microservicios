using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microservicio.Transacciones.Api.DTOs.Factura;
using Microservicio.Transacciones.Api.Interfaces;

namespace Microservicio.Transacciones.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FacturaController : ControllerBase
{
    private readonly IFacturaService _facturaService;

    public FacturaController(IFacturaService facturaService)
    {
        _facturaService = facturaService;
    }

    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] FacturaFiltroDto filtro)
    {
        var (items, totalRegistros) = await _facturaService.ListarAsync(filtro);

        return Ok(new
        {
            mensaje = "Facturas obtenidas correctamente.",
            totalRegistros,
            pagina = filtro.Pagina,
            registrosPorPagina = filtro.RegistrosPorPagina,
            datos = items
        });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        var factura = await _facturaService.ObtenerPorIdAsync(id);

        if (factura == null)
            return NotFound(new { mensaje = "Factura no encontrada." });

        return Ok(new
        {
            mensaje = "Factura obtenida correctamente.",
            datos = factura
        });
    }

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] FacturaCrearDto dto)
    {
        try
        {
            var usuId = ObtenerUsuarioAutenticadoId();

            if (!usuId.HasValue)
                return Unauthorized(new { mensaje = "No se pudo identificar el usuario autenticado." });

            var factura = await _facturaService.CrearAsync(dto, usuId.Value);

            return CreatedAtAction(nameof(ObtenerPorId), new { id = factura.FacId }, new
            {
                mensaje = "Factura creada correctamente.",
                datos = factura
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    private int? ObtenerUsuarioAutenticadoId()
    {
        var usuIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (int.TryParse(usuIdClaim, out int usuId))
            return usuId;

        return null;
    }

    [HttpPut("anular/{id:int}")]
    public async Task<IActionResult> Anular(int id)
    {
        try
        {
            var usuId = ObtenerUsuarioAutenticadoId();

            if (!usuId.HasValue)
                return Unauthorized(new { mensaje = "No se pudo identificar el usuario autenticado." });

            var resultado = await _facturaService.AnularAsync(id, usuId.Value);

            if (!resultado)
                return NotFound(new { mensaje = "Factura no encontrada." });

            return Ok(new { mensaje = "Factura anulada correctamente." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }
}