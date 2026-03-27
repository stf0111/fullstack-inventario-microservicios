using Microsoft.EntityFrameworkCore;
using Microservicio.Transacciones.Api.Data;
using Microservicio.Transacciones.Api.DTOs.Kardex;
using Microservicio.Transacciones.Api.Interfaces;

namespace Microservicio.Transacciones.Api.Services;

public class KardexService : IKardexService
{
    private readonly TransaccionesDbContext _context;
    private readonly ICatalogoApiService _catalogoApiService;

    public KardexService(TransaccionesDbContext context, ICatalogoApiService catalogoApiService)
    {
        _context = context;
        _catalogoApiService = catalogoApiService;
    }

    public async Task<(IEnumerable<KardexListadoDto> Items, int TotalRegistros)> ListarAsync(KardexFiltroDto filtro)
    {
        filtro.Pagina = filtro.Pagina <= 0 ? 1 : filtro.Pagina;
        filtro.RegistrosPorPagina = filtro.RegistrosPorPagina <= 0 ? 10 : filtro.RegistrosPorPagina;

        var query = _context.Kardices
            .AsNoTracking()
            .AsQueryable();

        if (filtro.ProdId.HasValue)
        {
            query = query.Where(k => k.ProdId == filtro.ProdId.Value);
        }

        if (filtro.UsuId.HasValue)
        {
            query = query.Where(k => k.UsuId == filtro.UsuId.Value);
        }

        if (!string.IsNullOrWhiteSpace(filtro.KdxTipo))
        {
            var tipo = filtro.KdxTipo.Trim().ToUpperInvariant();
            query = query.Where(k => k.KdxTipo.ToUpper() == tipo);
        }

        if (!string.IsNullOrWhiteSpace(filtro.KdxMotivo))
        {
            var motivo = filtro.KdxMotivo.Trim().ToUpperInvariant();
            query = query.Where(k => k.KdxMotivo != null && k.KdxMotivo.ToUpper().Contains(motivo));
        }

        if (filtro.FechaInicio.HasValue)
        {
            var fechaInicio = filtro.FechaInicio.Value;
            query = query.Where(k => k.KdxFecha >= fechaInicio);
        }

        if (filtro.FechaFin.HasValue)
        {
            var fechaFin = filtro.FechaFin.Value;
            query = query.Where(k => k.KdxFecha <= fechaFin);
        }

        var totalRegistros = await query.CountAsync();

        var movimientos = await query
            .OrderByDescending(k => k.KdxFecha)
            .ThenByDescending(k => k.KdxId)
            .Skip((filtro.Pagina - 1) * filtro.RegistrosPorPagina)
            .Take(filtro.RegistrosPorPagina)
            .Select(k => new KardexListadoDto
            {
                KdxId = k.KdxId,
                ProdId = k.ProdId,
                UsuId = k.UsuId,
                KdxFecha = k.KdxFecha,
                KdxTipo = k.KdxTipo,
                KdxMotivo = k.KdxMotivo,
                KdxDocRefer = k.KdxDocRefer,
                KdxCantidad = k.KdxCantidad,
                KdxSaldoAnt = k.KdxSaldoAnt,
                KdxSaldoFinal = k.KdxSaldoFinal,
                KdxCostoUnit = k.KdxCostoUnit,
                KdxPrecioUnit = k.KdxPrecioUnit
            })
            .ToListAsync();

        foreach (var item in movimientos)
        {
            var producto = await _catalogoApiService.ObtenerProductoAsync(item.ProdId);
            item.ProdNombre = producto?.ProdNombre;
        }

        return (movimientos, totalRegistros);
    }

    public async Task<KardexListadoDto?> ObtenerPorIdAsync(int id)
    {
        var movimiento = await _context.Kardices
            .AsNoTracking()
            .FirstOrDefaultAsync(k => k.KdxId == id);

        if (movimiento == null)
            return null;

        var producto = await _catalogoApiService.ObtenerProductoAsync(movimiento.ProdId);

        return new KardexListadoDto
        {
            KdxId = movimiento.KdxId,
            ProdId = movimiento.ProdId,
            ProdNombre = producto?.ProdNombre,
            UsuId = movimiento.UsuId,
            KdxFecha = movimiento.KdxFecha,
            KdxTipo = movimiento.KdxTipo,
            KdxMotivo = movimiento.KdxMotivo,
            KdxDocRefer = movimiento.KdxDocRefer,
            KdxCantidad = movimiento.KdxCantidad,
            KdxSaldoAnt = movimiento.KdxSaldoAnt,
            KdxSaldoFinal = movimiento.KdxSaldoFinal,
            KdxCostoUnit = movimiento.KdxCostoUnit,
            KdxPrecioUnit = movimiento.KdxPrecioUnit
        };
    }
}