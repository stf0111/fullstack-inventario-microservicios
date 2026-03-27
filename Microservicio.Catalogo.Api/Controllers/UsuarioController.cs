using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microservicio.Catalogo.Api.DTOs.Usuario;
using Microservicio.Catalogo.Api.Interfaces;

namespace Microservicio.Catalogo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsuarioController : ControllerBase
{
    private readonly IUsuarioService _usuarioService;

    public UsuarioController(IUsuarioService usuarioService)
    {
        _usuarioService = usuarioService;
    }

    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] UsuarioFiltroDto filtro)
    {
        var (items, totalRegistros) = await _usuarioService.ListarAsync(filtro);

        return Ok(new
        {
            mensaje = "Usuarios obtenidos correctamente.",
            totalRegistros,
            pagina = filtro.Pagina,
            registrosPorPagina = filtro.RegistrosPorPagina,
            datos = items
        });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        var usuario = await _usuarioService.ObtenerPorIdAsync(id);

        if (usuario == null)
            return NotFound(new { mensaje = "Usuario no encontrado." });

        return Ok(new
        {
            mensaje = "Usuario obtenido correctamente.",
            datos = usuario
        });
    }

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] UsuarioCrearDto dto)
    {
        try
        {
            var createdBy = ObtenerUsuarioAutenticadoId();
            var usuario = await _usuarioService.CrearAsync(dto, createdBy);

            return CreatedAtAction(nameof(ObtenerPorId), new { id = usuario.UsuId }, new
            {
                mensaje = "Usuario creado correctamente.",
                datos = usuario
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Editar(int id, [FromBody] UsuarioEditarDto dto)
    {
        try
        {
            var updatedBy = ObtenerUsuarioAutenticadoId();
            var resultado = await _usuarioService.EditarAsync(id, dto, updatedBy);

            if (!resultado)
                return NotFound(new { mensaje = "Usuario no encontrado." });

            return Ok(new { mensaje = "Usuario actualizado correctamente." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var deletedBy = ObtenerUsuarioAutenticadoId();
        var resultado = await _usuarioService.EliminarAsync(id, deletedBy);

        if (!resultado)
            return NotFound(new { mensaje = "Usuario no encontrado." });

        return Ok(new { mensaje = "Usuario eliminado correctamente." });
    }

    private int? ObtenerUsuarioAutenticadoId()
    {
        var usuIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (int.TryParse(usuIdClaim, out int usuId))
            return usuId;

        return null;
    }
}