using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microservicio.Transacciones.Api.DTOs.TipoPago;
using Microservicio.Transacciones.Api.Interfaces;

namespace Microservicio.Transacciones.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TipoPagoController : ControllerBase
{
    private readonly ITipoPagoService _tipoPagoService;

    public TipoPagoController(ITipoPagoService tipoPagoService)
    {
        _tipoPagoService = tipoPagoService;
    }

    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] TipoPagoFiltroDto filtro)
    {
        var (items, totalRegistros) = await _tipoPagoService.ListarAsync(filtro);

        return Ok(new
        {
            mensaje = "Tipos de pago obtenidos correctamente.",
            totalRegistros,
            pagina = filtro.Pagina,
            registrosPorPagina = filtro.RegistrosPorPagina,
            datos = items
        });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        var tipoPago = await _tipoPagoService.ObtenerPorIdAsync(id);

        if (tipoPago == null)
            return NotFound(new { mensaje = "Tipo de pago no encontrado." });

        return Ok(new
        {
            mensaje = "Tipo de pago obtenido correctamente.",
            datos = tipoPago
        });
    }

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] TipoPagoCrearDto dto)
    {
        try
        {
            var createdBy = ObtenerUsuarioAutenticadoId();
            var tipoPago = await _tipoPagoService.CrearAsync(dto, createdBy);

            return CreatedAtAction(nameof(ObtenerPorId), new { id = tipoPago.TpaId }, new
            {
                mensaje = "Tipo de pago creado correctamente.",
                datos = tipoPago
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Editar(int id, [FromBody] TipoPagoEditarDto dto)
    {
        try
        {
            var updatedBy = ObtenerUsuarioAutenticadoId();
            var resultado = await _tipoPagoService.EditarAsync(id, dto, updatedBy);

            if (!resultado)
                return NotFound(new { mensaje = "Tipo de pago no encontrado." });

            return Ok(new { mensaje = "Tipo de pago actualizado correctamente." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        try
        {
            var deletedBy = ObtenerUsuarioAutenticadoId();
            var resultado = await _tipoPagoService.EliminarAsync(id, deletedBy);

            if (!resultado)
                return NotFound(new { mensaje = "Tipo de pago no encontrado." });

            return Ok(new { mensaje = "Tipo de pago eliminado correctamente." });
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