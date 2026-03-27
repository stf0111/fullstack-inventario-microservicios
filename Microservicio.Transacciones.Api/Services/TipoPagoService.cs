using Microsoft.EntityFrameworkCore;
using Microservicio.Transacciones.Api.Data;
using Microservicio.Transacciones.Api.DTOs.TipoPago;
using Microservicio.Transacciones.Api.Interfaces;
using Microservicio.Transacciones.Api.Models;

namespace Microservicio.Transacciones.Api.Services;

public class TipoPagoService : ITipoPagoService
{
    private readonly TransaccionesDbContext _context;

    public TipoPagoService(TransaccionesDbContext context)
    {
        _context = context;
    }

    public async Task<(IEnumerable<TipoPagoListadoDto> Items, int TotalRegistros)> ListarAsync(TipoPagoFiltroDto filtro)
    {
        filtro.Pagina = filtro.Pagina <= 0 ? 1 : filtro.Pagina;
        filtro.RegistrosPorPagina = filtro.RegistrosPorPagina <= 0 ? 10 : filtro.RegistrosPorPagina;

        var query = _context.TipoPagos
            .AsNoTracking()
            .Where(t => t.DeletedAt == null)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filtro.Nombre))
        {
            var nombre = filtro.Nombre.Trim();
            query = query.Where(t => t.TpaNombre.Contains(nombre));
        }

        var totalRegistros = await query.CountAsync();

        var items = await query
            .OrderByDescending(t => t.TpaId)
            .Skip((filtro.Pagina - 1) * filtro.RegistrosPorPagina)
            .Take(filtro.RegistrosPorPagina)
            .Select(t => new TipoPagoListadoDto
            {
                TpaId = t.TpaId,
                TpaNombre = t.TpaNombre,
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt
            })
            .ToListAsync();

        return (items, totalRegistros);
    }

    public async Task<TipoPagoListadoDto?> ObtenerPorIdAsync(int id)
    {
        var tipoPago = await _context.TipoPagos
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.TpaId == id && t.DeletedAt == null);

        if (tipoPago == null)
            return null;

        return MapearTipoPago(tipoPago);
    }

    public async Task<TipoPagoListadoDto> CrearAsync(TipoPagoCrearDto dto, int? createdBy = null)
    {
        var nombre = dto.TpaNombre.Trim();

        var existe = await _context.TipoPagos
            .AnyAsync(t => t.TpaNombre == nombre && t.DeletedAt == null);

        if (existe)
            throw new Exception("Ya existe un tipo de pago con ese nombre.");

        var tipoPago = new TipoPago
        {
            TpaNombre = nombre,
            CreatedAt = DateTime.Now,
            CreatedBy = createdBy
        };

        _context.TipoPagos.Add(tipoPago);
        await _context.SaveChangesAsync();

        return MapearTipoPago(tipoPago);
    }

    public async Task<bool> EditarAsync(int id, TipoPagoEditarDto dto, int? updatedBy = null)
    {
        var tipoPago = await _context.TipoPagos
            .FirstOrDefaultAsync(t => t.TpaId == id && t.DeletedAt == null);

        if (tipoPago == null)
            return false;

        var nombre = dto.TpaNombre.Trim();

        var existe = await _context.TipoPagos
            .AnyAsync(t => t.TpaId != id && t.TpaNombre == nombre && t.DeletedAt == null);

        if (existe)
            throw new Exception("Ya existe otro tipo de pago con ese nombre.");

        tipoPago.TpaNombre = nombre;
        tipoPago.UpdatedAt = DateTime.Now;
        tipoPago.UpdatedBy = updatedBy;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> EliminarAsync(int id, int? deletedBy = null)
    {
        var tipoPago = await _context.TipoPagos
            .FirstOrDefaultAsync(t => t.TpaId == id && t.DeletedAt == null);

        if (tipoPago == null)
            return false;

        var tieneFacturas = await _context.Facturas
            .AnyAsync(f => f.TpaId == id && f.DeletedAt == null);

        if (tieneFacturas)
            throw new Exception("No se puede eliminar el tipo de pago porque tiene facturas asociadas.");

        tipoPago.DeletedAt = DateTime.Now;
        tipoPago.DeletedBy = deletedBy;
        tipoPago.UpdatedAt = DateTime.Now;
        tipoPago.UpdatedBy = deletedBy;

        await _context.SaveChangesAsync();
        return true;
    }

    private static TipoPagoListadoDto MapearTipoPago(TipoPago tipoPago)
    {
        return new TipoPagoListadoDto
        {
            TpaId = tipoPago.TpaId,
            TpaNombre = tipoPago.TpaNombre,
            CreatedAt = tipoPago.CreatedAt,
            UpdatedAt = tipoPago.UpdatedAt
        };
    }
}