using Microservicio.Catalogo.Api.DTOs.Marca;
using Microservicio.Catalogo.Api.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Microservicio.Catalogo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]

public class MarcaController : ControllerBase
{
    private readonly IMarcaService _marcaService;

    public MarcaController(IMarcaService marcaService)
    {
        _marcaService = marcaService;
    }

    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] MarcaFiltroDto filtro)
    {
        var (items, totalRegistros) = await _marcaService.ListarAsync(filtro);

        return Ok(new
        {
            mensaje = "Marcas obtenidas correctamente.",
            totalRegistros,
            pagina = filtro.Pagina,
            registrosPorPagina = filtro.RegistrosPorPagina,
            datos = items
        });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        var marca = await _marcaService.ObtenerPorIdAsync(id);

        if (marca == null)
            return NotFound(new { mensaje = "Marca no encontrada." });

        return Ok(new
        {
            mensaje = "Marca obtenida correctamente.",
            datos = marca
        });
    }

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] MarcaCrearDto dto)
    {
        try
        {
            var marca = await _marcaService.CrearAsync(dto);

            return CreatedAtAction(nameof(ObtenerPorId), new { id = marca.MarcaId }, new
            {
                mensaje = "Marca creada correctamente.",
                datos = marca
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Editar(int id, [FromBody] MarcaEditarDto dto)
    {
        try
        {
            var resultado = await _marcaService.EditarAsync(id, dto);

            if (!resultado)
                return NotFound(new { mensaje = "Marca no encontrada." });

            return Ok(new { mensaje = "Marca actualizada correctamente." });
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
            var resultado = await _marcaService.EliminarAsync(id);

            if (!resultado)
                return NotFound(new { mensaje = "Marca no encontrada." });

            return Ok(new { mensaje = "Marca eliminada correctamente." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }
}