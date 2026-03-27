using Microservicio.Catalogo.Api.DTOs.Imagen;
using Microservicio.Catalogo.Api.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Microservicio.Catalogo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]

public class ImagenController : ControllerBase
{
    private readonly IImagenService _imagenService;

    public ImagenController(IImagenService imagenService)
    {
        _imagenService = imagenService;
    }

    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] ImagenFiltroDto filtro)
    {
        var (items, totalRegistros) = await _imagenService.ListarAsync(filtro);

        return Ok(new
        {
            mensaje = "Imágenes obtenidas correctamente.",
            totalRegistros,
            pagina = filtro.Pagina,
            registrosPorPagina = filtro.RegistrosPorPagina,
            datos = items
        });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        var imagen = await _imagenService.ObtenerPorIdAsync(id);

        if (imagen == null)
            return NotFound(new { mensaje = "Imagen no encontrada." });

        return Ok(new
        {
            mensaje = "Imagen obtenida correctamente.",
            datos = imagen
        });
    }

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] ImagenCrearDto dto)
    {
        try
        {
            var imagen = await _imagenService.CrearAsync(dto);

            return CreatedAtAction(nameof(ObtenerPorId), new { id = imagen.ImgId }, new
            {
                mensaje = "Imagen creada correctamente.",
                datos = imagen
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Editar(int id, [FromBody] ImagenEditarDto dto)
    {
        try
        {
            var resultado = await _imagenService.EditarAsync(id, dto);

            if (!resultado)
                return NotFound(new { mensaje = "Imagen no encontrada." });

            return Ok(new { mensaje = "Imagen actualizada correctamente." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var resultado = await _imagenService.EliminarAsync(id);

        if (!resultado)
            return NotFound(new { mensaje = "Imagen no encontrada." });

        return Ok(new { mensaje = "Imagen eliminada correctamente." });
    }
}