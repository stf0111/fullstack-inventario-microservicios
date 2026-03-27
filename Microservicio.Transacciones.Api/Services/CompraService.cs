using Microsoft.EntityFrameworkCore;
using Microservicio.Transacciones.Api.Data;
using Microservicio.Transacciones.Api.DTOs.Compra;
using Microservicio.Transacciones.Api.Interfaces;
using Microservicio.Transacciones.Api.Models;

namespace Microservicio.Transacciones.Api.Services;

public class CompraService : ICompraService
{
    private readonly TransaccionesDbContext _context;
    private readonly ICatalogoApiService _catalogoApiService;

    public CompraService(TransaccionesDbContext context, ICatalogoApiService catalogoApiService)
    {
        _context = context;
        _catalogoApiService = catalogoApiService;
    }

    public async Task<(IEnumerable<CompraDto> Items, int TotalRegistros)> ListarAsync(CompraFiltroDto filtro)
    {
        filtro.Pagina = filtro.Pagina <= 0 ? 1 : filtro.Pagina;
        filtro.RegistrosPorPagina = filtro.RegistrosPorPagina <= 0 ? 10 : filtro.RegistrosPorPagina;

        var query = _context.Compras
            .AsNoTracking()
            .Include(c => c.Prov)
            .Include(c => c.ProductoCompras)
            .Where(c => c.DeletedAt == null)
            .AsQueryable();

        if (filtro.ProvId.HasValue)
        {
            query = query.Where(c => c.ProvId == filtro.ProvId.Value);
        }

        if (filtro.FechaInicio.HasValue)
        {
            var fechaInicio = filtro.FechaInicio.Value;
            query = query.Where(c => c.CompraFecha >= fechaInicio);
        }

        if (filtro.FechaFin.HasValue)
        {
            var fechaFin = filtro.FechaFin.Value;
            query = query.Where(c => c.CompraFecha <= fechaFin);
        }

        var totalRegistros = await query.CountAsync();

        var items = await query
            .OrderByDescending(c => c.CompraId)
            .Skip((filtro.Pagina - 1) * filtro.RegistrosPorPagina)
            .Take(filtro.RegistrosPorPagina)
            .Select(c => new CompraDto
            {
                CompraId = c.CompraId,
                ProvId = c.ProvId,
                ProvNombre = c.Prov != null ? c.Prov.ProvNombre : null,
                CompraFecha = c.CompraFecha,
                UsuId = c.UsuId,
                Total = c.ProductoCompras
                    .Where(d => d.DeletedAt == null)
                    .Sum(d => d.PrdcomCantidad * d.PrdcomPrecio)
            })
            .ToListAsync();

        return (items, totalRegistros);
    }

    public async Task<CompraDto?> ObtenerPorIdAsync(int id)
    {
        var compra = await _context.Compras
            .AsNoTracking()
            .Include(c => c.Prov)
            .Include(c => c.ProductoCompras)
            .FirstOrDefaultAsync(c => c.CompraId == id && c.DeletedAt == null);

        if (compra == null)
            return null;

        var respuesta = new CompraDto
        {
            CompraId = compra.CompraId,
            ProvId = compra.ProvId,
            ProvNombre = compra.Prov?.ProvNombre,
            CompraFecha = compra.CompraFecha,
            UsuId = compra.UsuId,
            Total = compra.ProductoCompras
                .Where(d => d.DeletedAt == null)
                .Sum(d => d.PrdcomCantidad * d.PrdcomPrecio)
        };

        foreach (var detalle in compra.ProductoCompras.Where(d => d.DeletedAt == null))
        {
            var producto = await _catalogoApiService.ObtenerProductoAsync(detalle.ProdId);

            respuesta.Detalles.Add(new CompraDetalleDto
            {
                ProdId = detalle.ProdId,
                ProdNombre = producto?.ProdNombre,
                Cantidad = detalle.PrdcomCantidad,
                Precio = detalle.PrdcomPrecio,
                Subtotal = detalle.PrdcomCantidad * detalle.PrdcomPrecio
            });
        }

        return respuesta;
    }

    public async Task<CompraDto> CrearAsync(CompraCrearDto dto, int usuId)
    {
        if (dto.Detalles == null || dto.Detalles.Count == 0)
            throw new Exception("Debe enviar al menos un detalle de compra.");

        var productosDuplicados = dto.Detalles
            .GroupBy(d => d.ProdId)
            .Where(g => g.Count() > 1)
            .Select(g => g.Key)
            .ToList();

        if (productosDuplicados.Any())
            throw new Exception("No se permiten productos repetidos en la misma compra.");

        var proveedor = await _context.Proveedors
            .FirstOrDefaultAsync(p => p.ProvId == dto.ProvId && p.DeletedAt == null);

        if (proveedor == null)
            throw new Exception("El proveedor seleccionado no existe.");

        var productosCatalogo = new Dictionary<int, DTOs.Catalogo.ProductoCatalogoDto>();

        foreach (var item in dto.Detalles)
        {
            var producto = await _catalogoApiService.ObtenerProductoAsync(item.ProdId);

            if (producto == null)
                throw new Exception($"El producto con id {item.ProdId} no existe en Catálogo.");

            if (!producto.ProdEstado)
                throw new Exception($"El producto {producto.ProdNombre} está inactivo.");

            productosCatalogo[item.ProdId] = producto;
        }

        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            var compra = new Compra
            {
                ProvId = dto.ProvId,
                CompraFecha = dto.CompraFecha ?? DateOnly.FromDateTime(DateTime.Now),
                UsuId = usuId,
                CreatedAt = DateTime.Now,
                CreatedBy = usuId
            };

            _context.Compras.Add(compra);
            await _context.SaveChangesAsync();

            foreach (var item in dto.Detalles)
            {
                var producto = productosCatalogo[item.ProdId];

                var detalle = new ProductoCompra
                {
                    CompraId = compra.CompraId,
                    ProdId = item.ProdId,
                    PrdcomCantidad = item.Cantidad,
                    PrdcomPrecio = item.Precio,
                    CreatedAt = DateTime.Now,
                    CreatedBy = usuId
                };

                _context.ProductoCompras.Add(detalle);

                var kardex = new Kardex
                {
                    KdxTipo = "ENTRADA",
                    KdxMotivo = "COMPRA",
                    KdxDocRefer = $"COMPRA-{compra.CompraId}",
                    KdxFecha = DateTime.Now,
                    ProdId = item.ProdId,
                    UsuId = usuId,
                    KdxCantidad = item.Cantidad,
                    KdxSaldoAnt = producto.ProdCantidad,
                    KdxSaldoFinal = producto.ProdCantidad + item.Cantidad,
                    KdxCostoUnit = item.Precio,
                    KdxPrecioUnit = producto.ProdPrecioven
                };

                _context.Kardices.Add(kardex);
            }

            await _context.SaveChangesAsync();

            foreach (var item in dto.Detalles)
            {
                var actualizado = await _catalogoApiService.SumarStockAsync(item.ProdId, item.Cantidad);

                if (!actualizado)
                    throw new Exception($"No se pudo actualizar el stock del producto {item.ProdId} en Catálogo.");
            }

            await transaction.CommitAsync();

            var compraCreada = await ObtenerPorIdAsync(compra.CompraId);

            if (compraCreada == null)
                throw new Exception("No se pudo recuperar la compra creada.");

            return compraCreada;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}