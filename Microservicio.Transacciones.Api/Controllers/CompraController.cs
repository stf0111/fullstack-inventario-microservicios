using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microservicio.Transacciones.Api.DTOs.Compra;
using Microservicio.Transacciones.Api.Interfaces;

namespace Microservicio.Transacciones.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CompraController : ControllerBase
{
    private readonly ICompraService _compraService;

    public CompraController(ICompraService compraService)
    {
        _compraService = compraService;
    }

    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] CompraFiltroDto filtro)
    {
        var (items, totalRegistros) = await _compraService.ListarAsync(filtro);

        return Ok(new
        {
            mensaje = "Compras obtenidas correctamente.",
            totalRegistros,
            pagina = filtro.Pagina,
            registrosPorPagina = filtro.RegistrosPorPagina,
            datos = items
        });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        var compra = await _compraService.ObtenerPorIdAsync(id);

        if (compra == null)
            return NotFound(new { mensaje = "Compra no encontrada." });

        return Ok(new
        {
            mensaje = "Compra obtenida correctamente.",
            datos = compra
        });
    }

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] CompraCrearDto dto)
    {
        try
        {
            var usuId = ObtenerUsuarioAutenticadoId();

            if (!usuId.HasValue)
                return Unauthorized(new { mensaje = "No se pudo identificar el usuario autenticado." });

            var compra = await _compraService.CrearAsync(dto, usuId.Value);

            return CreatedAtAction(nameof(ObtenerPorId), new { id = compra.CompraId }, new
            {
                mensaje = "Compra creada correctamente.",
                datos = compra
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
}