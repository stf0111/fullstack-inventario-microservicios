using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microservicio.Transacciones.Api.DTOs.Cliente;
using Microservicio.Transacciones.Api.Interfaces;

namespace Microservicio.Transacciones.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ClienteController : ControllerBase
{
    private readonly IClienteService _clienteService;

    public ClienteController(IClienteService clienteService)
    {
        _clienteService = clienteService;
    }

    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] ClienteFiltroDto filtro)
    {
        var (items, totalRegistros) = await _clienteService.ListarAsync(filtro);

        return Ok(new
        {
            mensaje = "Clientes obtenidos correctamente.",
            totalRegistros,
            pagina = filtro.Pagina,
            registrosPorPagina = filtro.RegistrosPorPagina,
            datos = items
        });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        var cliente = await _clienteService.ObtenerPorIdAsync(id);

        if (cliente == null)
            return NotFound(new { mensaje = "Cliente no encontrado." });

        return Ok(new
        {
            mensaje = "Cliente obtenido correctamente.",
            datos = cliente
        });
    }

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] ClienteCrearDto dto)
    {
        try
        {
            var createdBy = ObtenerUsuarioAutenticadoId();
            var cliente = await _clienteService.CrearAsync(dto, createdBy);

            return CreatedAtAction(nameof(ObtenerPorId), new { id = cliente.CliId }, new
            {
                mensaje = "Cliente creado correctamente.",
                datos = cliente
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Editar(int id, [FromBody] ClienteEditarDto dto)
    {
        try
        {
            var updatedBy = ObtenerUsuarioAutenticadoId();
            var resultado = await _clienteService.EditarAsync(id, dto, updatedBy);

            if (!resultado)
                return NotFound(new { mensaje = "Cliente no encontrado." });

            return Ok(new { mensaje = "Cliente actualizado correctamente." });
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
            var resultado = await _clienteService.EliminarAsync(id, deletedBy);

            if (!resultado)
                return NotFound(new { mensaje = "Cliente no encontrado." });

            return Ok(new { mensaje = "Cliente eliminado correctamente." });
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