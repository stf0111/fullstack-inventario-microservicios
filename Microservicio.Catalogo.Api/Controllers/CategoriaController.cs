using Microsoft.AspNetCore.Mvc;
using Microservicio.Catalogo.Api.DTOs.Categoria;
using Microservicio.Catalogo.Api.Interfaces;
using Microsoft.AspNetCore.Authorization;

namespace Microservicio.Catalogo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]

public class CategoriaController : ControllerBase
{
    private readonly ICategoriaService _categoriaService;

    public CategoriaController(ICategoriaService categoriaService)
    {
        _categoriaService = categoriaService;
    }

    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] CategoriaFiltroDto filtro)
    {
        var (items, totalRegistros) = await _categoriaService.ListarAsync(filtro);

        return Ok(new
        {
            mensaje = "Categorías obtenidas correctamente.",
            totalRegistros,
            pagina = filtro.Pagina,
            registrosPorPagina = filtro.RegistrosPorPagina,
            datos = items
        });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        var categoria = await _categoriaService.ObtenerPorIdAsync(id);

        if (categoria == null)
            return NotFound(new { mensaje = "Categoría no encontrada." });

        return Ok(new
        {
            mensaje = "Categoría obtenida correctamente.",
            datos = categoria
        });
    }

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] CategoriaCrearDto dto)
    {
        try
        {
            var categoria = await _categoriaService.CrearAsync(dto);

            return CreatedAtAction(nameof(ObtenerPorId), new { id = categoria.CatId }, new
            {
                mensaje = "Categoría creada correctamente.",
                datos = categoria
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Editar(int id, [FromBody] CategoriaEditarDto dto)
    {
        try
        {
            var resultado = await _categoriaService.EditarAsync(id, dto);

            if (!resultado)
                return NotFound(new { mensaje = "Categoría no encontrada." });

            return Ok(new { mensaje = "Categoría actualizada correctamente." });
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
            var resultado = await _categoriaService.EliminarAsync(id);

            if (!resultado)
                return NotFound(new { mensaje = "Categoría no encontrada." });

            return Ok(new { mensaje = "Categoría eliminada correctamente." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }
}