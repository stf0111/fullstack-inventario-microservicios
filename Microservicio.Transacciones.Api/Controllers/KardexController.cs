using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microservicio.Transacciones.Api.DTOs.Kardex;
using Microservicio.Transacciones.Api.Interfaces;

namespace Microservicio.Transacciones.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class KardexController : ControllerBase
{
    private readonly IKardexService _kardexService;

    public KardexController(IKardexService kardexService)
    {
        _kardexService = kardexService;
    }

    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] KardexFiltroDto filtro)
    {
        var (items, totalRegistros) = await _kardexService.ListarAsync(filtro);

        return Ok(new
        {
            mensaje = "Movimientos de kardex obtenidos correctamente.",
            totalRegistros,
            pagina = filtro.Pagina,
            registrosPorPagina = filtro.RegistrosPorPagina,
            datos = items
        });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> ObtenerPorId(int id)
    {
        var movimiento = await _kardexService.ObtenerPorIdAsync(id);

        if (movimiento == null)
            return NotFound(new { mensaje = "Movimiento de kardex no encontrado." });

        return Ok(new
        {
            mensaje = "Movimiento de kardex obtenido correctamente.",
            datos = movimiento
        });
    }
}