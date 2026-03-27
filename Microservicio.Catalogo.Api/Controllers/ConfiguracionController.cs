using Microservicio.Catalogo.Api.DTOs.Configuracion;
using Microservicio.Catalogo.Api.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Microservicio.Catalogo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "ADMIN")]

public class ConfiguracionController : ControllerBase
{
    private readonly IConfiguracionService _configuracionService;

    public ConfiguracionController(IConfiguracionService configuracionService)
    {
        _configuracionService = configuracionService;
    }

    [HttpGet]
    public async Task<IActionResult> Obtener()
    {
        var configuracion = await _configuracionService.ObtenerAsync();

        if (configuracion == null)
            return NotFound(new { mensaje = "No existe configuración registrada." });

        return Ok(new
        {
            mensaje = "Configuración obtenida correctamente.",
            datos = configuracion
        });
    }

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] ConfiguracionCrearDto dto)
    {
        try
        {
            var configuracion = await _configuracionService.CrearAsync(dto);

            return CreatedAtAction(nameof(Obtener), new
            {
                mensaje = "Configuración creada correctamente.",
                datos = configuracion
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Editar(int id, [FromBody] ConfiguracionEditarDto dto)
    {
        try
        {
            var resultado = await _configuracionService.EditarAsync(id, dto);

            if (!resultado)
                return NotFound(new { mensaje = "Configuración no encontrada." });

            return Ok(new { mensaje = "Configuración actualizada correctamente." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }
}