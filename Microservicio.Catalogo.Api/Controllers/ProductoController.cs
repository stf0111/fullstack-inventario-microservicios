using Microservicio.Catalogo.Api.DTOs.Producto;
using Microservicio.Catalogo.Api.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
namespace Microservicio.Catalogo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProductoController : ControllerBase
{
    private readonly IProductoService _productoService;

    public ProductoController(IProductoService productoService)
    {
        _productoService = productoService;
    }

    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] ProductoFiltroDto filtro)
    {
        var (items, totalRegistros) = await _productoService.ListarAsync(filtro);

        return Ok(new
        {
            mensaje = "Productos obtenidos correctamente.",
            totalRegistros,
            pagina = filtro.Pagina,
            registrosPorPagina = filtro.RegistrosPorPagina,
            datos = items
        });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        var producto = await _productoService.ObtenerPorIdAsync(id);

        if (producto == null)
            return NotFound(new { mensaje = "Producto no encontrado." });

        return Ok(new
        {
            mensaje = "Producto obtenido correctamente.",
            datos = producto
        });
    }

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] ProductoCrearDto dto)
    {
        try
        {
            var producto = await _productoService.CrearAsync(dto);

            return CreatedAtAction(nameof(ObtenerPorId), new { id = producto.ProdId }, new
            {
                mensaje = "Producto creado correctamente.",
                datos = producto
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Editar(int id, [FromBody] ProductoEditarDto dto)
    {
        try
        {
            var resultado = await _productoService.EditarAsync(id, dto);

            if (!resultado)
                return NotFound(new { mensaje = "Producto no encontrado." });

            return Ok(new { mensaje = "Producto actualizado correctamente." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var resultado = await _productoService.EliminarAsync(id);

        if (!resultado)
            return NotFound(new { mensaje = "Producto no encontrado." });

        return Ok(new { mensaje = "Producto eliminado correctamente." });
    }

    [HttpPut("stock/{id:int}")]
    public async Task<IActionResult> AjustarStock(int id, [FromBody] ProductoAjustarStockDto dto)
    {
        try
        {
            var updatedBy = ObtenerUsuarioAutenticadoId();
            var resultado = await _productoService.AjustarStockAsync(id, dto, updatedBy);

            if (!resultado)
                return NotFound(new { mensaje = "Producto no encontrado." });

            return Ok(new { mensaje = "Stock ajustado correctamente." });
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