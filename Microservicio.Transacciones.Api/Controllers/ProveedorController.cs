using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microservicio.Transacciones.Api.DTOs.Proveedor;
using Microservicio.Transacciones.Api.Interfaces;

namespace Microservicio.Transacciones.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProveedorController : ControllerBase
{
    private readonly IProveedorService _proveedorService;

    public ProveedorController(IProveedorService proveedorService)
    {
        _proveedorService = proveedorService;
    }

    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] ProveedorFiltroDto filtro)
    {
        var (items, totalRegistros) = await _proveedorService.ListarAsync(filtro);

        return Ok(new
        {
            mensaje = "Proveedores obtenidos correctamente.",
            totalRegistros,
            pagina = filtro.Pagina,
            registrosPorPagina = filtro.RegistrosPorPagina,
            datos = items
        });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        var proveedor = await _proveedorService.ObtenerPorIdAsync(id);

        if (proveedor == null)
            return NotFound(new { mensaje = "Proveedor no encontrado." });

        return Ok(new
        {
            mensaje = "Proveedor obtenido correctamente.",
            datos = proveedor
        });
    }

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] ProveedorCrearDto dto)
    {
        try
        {
            var createdBy = ObtenerUsuarioAutenticadoId();
            var proveedor = await _proveedorService.CrearAsync(dto, createdBy);

            return CreatedAtAction(nameof(ObtenerPorId), new { id = proveedor.ProvId }, new
            {
                mensaje = "Proveedor creado correctamente.",
                datos = proveedor
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Editar(int id, [FromBody] ProveedorEditarDto dto)
    {
        try
        {
            var updatedBy = ObtenerUsuarioAutenticadoId();
            var resultado = await _proveedorService.EditarAsync(id, dto, updatedBy);

            if (!resultado)
                return NotFound(new { mensaje = "Proveedor no encontrado." });

            return Ok(new { mensaje = "Proveedor actualizado correctamente." });
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
            var resultado = await _proveedorService.EliminarAsync(id, deletedBy);

            if (!resultado)
                return NotFound(new { mensaje = "Proveedor no encontrado." });

            return Ok(new { mensaje = "Proveedor eliminado correctamente." });
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