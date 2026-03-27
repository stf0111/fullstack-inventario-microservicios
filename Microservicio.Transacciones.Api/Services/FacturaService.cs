using Microsoft.EntityFrameworkCore;
using Microservicio.Transacciones.Api.Data;
using Microservicio.Transacciones.Api.DTOs.Catalogo;
using Microservicio.Transacciones.Api.DTOs.Factura;
using Microservicio.Transacciones.Api.Interfaces;
using Microservicio.Transacciones.Api.Models;

namespace Microservicio.Transacciones.Api.Services;

public class FacturaService : IFacturaService
{
    private readonly TransaccionesDbContext _context;
    private readonly ICatalogoApiService _catalogoApiService;
    private readonly IConfiguration _configuration;

    public FacturaService(
        TransaccionesDbContext context,
        ICatalogoApiService catalogoApiService,
        IConfiguration configuration)
    {
        _context = context;
        _catalogoApiService = catalogoApiService;
        _configuration = configuration;
    }

    public async Task<(IEnumerable<FacturaDto> Items, int TotalRegistros)> ListarAsync(FacturaFiltroDto filtro)
    {
        filtro.Pagina = filtro.Pagina <= 0 ? 1 : filtro.Pagina;
        filtro.RegistrosPorPagina = filtro.RegistrosPorPagina <= 0 ? 10 : filtro.RegistrosPorPagina;

        var query = _context.Facturas
            .AsNoTracking()
            .Include(f => f.Cli)
            .Include(f => f.Tpa)
            .Where(f => f.DeletedAt == null)
            .AsQueryable();

        if (filtro.CliId.HasValue)
            query = query.Where(f => f.CliId == filtro.CliId.Value);

        if (filtro.TpaId.HasValue)
            query = query.Where(f => f.TpaId == filtro.TpaId.Value);

        if (filtro.FacEstado.HasValue)
            query = query.Where(f => f.FacEstado == filtro.FacEstado.Value);

        if (filtro.FechaInicio.HasValue)
            query = query.Where(f => f.FacFecha >= filtro.FechaInicio.Value);

        if (filtro.FechaFin.HasValue)
            query = query.Where(f => f.FacFecha <= filtro.FechaFin.Value);

        var totalRegistros = await query.CountAsync();

        var items = await query
            .OrderByDescending(f => f.FacId)
            .Skip((filtro.Pagina - 1) * filtro.RegistrosPorPagina)
            .Take(filtro.RegistrosPorPagina)
            .Select(f => new FacturaDto
            {
                FacId = f.FacId,
                CliId = f.CliId,
                CliNombreCompleto = f.Cli != null ? f.Cli.CliNombre + " " + f.Cli.CliApellido : null,
                UsuId = f.UsuId,
                TpaId = f.TpaId,
                TpaNombre = f.Tpa != null ? f.Tpa.TpaNombre : null,
                FacFecha = f.FacFecha,
                FacNumeroSerie = f.FacNumeroSerie,
                FacSubtotal = f.FacSubtotal,
                FacIvaValor = f.FacIvaValor,
                FacTotal = f.FacTotal,
                FacEstado = f.FacEstado
            })
            .ToListAsync();

        return (items, totalRegistros);
    }

    public async Task<FacturaDto?> ObtenerPorIdAsync(int id)
    {
        var factura = await _context.Facturas
            .AsNoTracking()
            .Include(f => f.Cli)
            .Include(f => f.Tpa)
            .Include(f => f.ProductoFacturas)
            .FirstOrDefaultAsync(f => f.FacId == id && f.DeletedAt == null);

        if (factura == null)
            return null;

        var respuesta = new FacturaDto
        {
            FacId = factura.FacId,
            CliId = factura.CliId,
            CliNombreCompleto = factura.Cli != null ? factura.Cli.CliNombre + " " + factura.Cli.CliApellido : null,
            UsuId = factura.UsuId,
            TpaId = factura.TpaId,
            TpaNombre = factura.Tpa?.TpaNombre,
            FacFecha = factura.FacFecha,
            FacNumeroSerie = factura.FacNumeroSerie,
            FacSubtotal = factura.FacSubtotal,
            FacIvaValor = factura.FacIvaValor,
            FacTotal = factura.FacTotal,
            FacEstado = factura.FacEstado
        };

        foreach (var detalle in factura.ProductoFacturas)
        {
            var producto = await _catalogoApiService.ObtenerProductoAsync(detalle.ProdId);

            respuesta.Detalles.Add(new FacturaDetalleDto
            {
                ProdId = detalle.ProdId,
                ProdNombre = producto?.ProdNombre,
                Cantidad = detalle.FpCantidad,
                Precio = detalle.FpPrecio,
                Subtotal = detalle.FpCantidad * detalle.FpPrecio
            });
        }

        return respuesta;
    }

    public async Task<FacturaDto> CrearAsync(FacturaCrearDto dto, int usuId)
    {
        if (dto.Detalles == null || dto.Detalles.Count == 0)
            throw new Exception("Debe enviar al menos un detalle de factura.");

        var productosDuplicados = dto.Detalles
            .GroupBy(d => d.ProdId)
            .Where(g => g.Count() > 1)
            .Select(g => g.Key)
            .ToList();

        if (productosDuplicados.Any())
            throw new Exception("No se permiten productos repetidos en la misma factura.");

        var cliente = await _context.Clientes
            .FirstOrDefaultAsync(c => c.CliId == dto.CliId && c.DeletedAt == null);

        if (cliente == null)
            throw new Exception("El cliente seleccionado no existe.");

        var tipoPago = await _context.TipoPagos
            .FirstOrDefaultAsync(t => t.TpaId == dto.TpaId && t.DeletedAt == null);

        if (tipoPago == null)
            throw new Exception("El tipo de pago seleccionado no existe.");

        var productosCatalogo = new Dictionary<int, ProductoCatalogoDto>();

        foreach (var item in dto.Detalles)
        {
            var producto = await _catalogoApiService.ObtenerProductoAsync(item.ProdId);

            if (producto == null)
                throw new Exception($"El producto con id {item.ProdId} no existe en Catálogo.");

            if (!producto.ProdEstado)
                throw new Exception($"El producto {producto.ProdNombre} está inactivo.");

            if (producto.ProdCantidad < item.Cantidad)
                throw new Exception($"Stock insuficiente para el producto {producto.ProdNombre}. Stock actual: {producto.ProdCantidad}.");

            productosCatalogo[item.ProdId] = producto;
        }

        var ivaPorcentaje = _configuration.GetValue<decimal?>("Facturacion:IvaPorcentaje") ?? 15m;

        var subtotal = dto.Detalles.Sum(d => d.Cantidad * productosCatalogo[d.ProdId].ProdPrecioven);
        var ivaValor = Math.Round(subtotal * (ivaPorcentaje / 100m), 2);
        var total = subtotal + ivaValor;

        var stocksDescontados = new List<(int ProdId, int Cantidad)>();

        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            var factura = new Factura
            {
                CliId = dto.CliId,
                UsuId = usuId,
                TpaId = dto.TpaId,
                FacFecha = dto.FacFecha ?? DateOnly.FromDateTime(DateTime.Now),
                FacSubtotal = subtotal,
                FacIvaValor = ivaValor,
                FacTotal = total,
                FacEstado = true,
                CreatedAt = DateTime.Now,
                CreatedBy = usuId
            };

            _context.Facturas.Add(factura);
            await _context.SaveChangesAsync();

            factura.FacNumeroSerie = GenerarNumeroSerie(factura.FacId);

            foreach (var item in dto.Detalles)
            {
                var producto = productosCatalogo[item.ProdId];

                var detalle = new ProductoFactura
                {
                    FacId = factura.FacId,
                    ProdId = item.ProdId,
                    FpCantidad = item.Cantidad,
                    FpPrecio = producto.ProdPrecioven
                };

                _context.ProductoFacturas.Add(detalle);

                var kardex = new Kardex
                {
                    KdxTipo = "SALIDA",
                    KdxMotivo = "VENTA",
                    KdxDocRefer = factura.FacNumeroSerie,
                    KdxFecha = DateTime.Now,
                    ProdId = item.ProdId,
                    UsuId = usuId,
                    KdxCantidad = item.Cantidad,
                    KdxSaldoAnt = producto.ProdCantidad,
                    KdxSaldoFinal = producto.ProdCantidad - item.Cantidad,
                    KdxCostoUnit = producto.ProdPreciocom,
                    KdxPrecioUnit = producto.ProdPrecioven
                };

                _context.Kardices.Add(kardex);
            }

            await _context.SaveChangesAsync();

            foreach (var item in dto.Detalles)
            {
                var actualizado = await _catalogoApiService.RestarStockAsync(item.ProdId, item.Cantidad);

                if (!actualizado)
                    throw new Exception($"No se pudo actualizar el stock del producto {item.ProdId} en Catálogo.");

                stocksDescontados.Add((item.ProdId, item.Cantidad));
            }

            await transaction.CommitAsync();

            var facturaCreada = await ObtenerPorIdAsync(factura.FacId);

            if (facturaCreada == null)
                throw new Exception("No se pudo recuperar la factura creada.");

            return facturaCreada;
        }
        catch
        {
            await transaction.RollbackAsync();

            foreach (var item in stocksDescontados)
            {
                try
                {
                    await _catalogoApiService.SumarStockAsync(item.ProdId, item.Cantidad);
                }
                catch
                {
                }
            }

            throw;
        }
    }

    private static string GenerarNumeroSerie(int facId)
    {
        return $"FAC-{DateTime.Now:yyyyMMdd}-{facId:D6}";
    }

    public async Task<bool> AnularAsync(int id, int usuId)
    {
        var factura = await _context.Facturas
            .Include(f => f.ProductoFacturas)
            .FirstOrDefaultAsync(f => f.FacId == id && f.DeletedAt == null);

        if (factura == null)
            return false;

        if (factura.FacEstado == false)
            throw new Exception("La factura ya se encuentra anulada.");

        var productosCatalogo = new Dictionary<int, ProductoCatalogoDto>();

        foreach (var detalle in factura.ProductoFacturas)
        {
            var producto = await _catalogoApiService.ObtenerProductoAsync(detalle.ProdId);

            if (producto == null)
                throw new Exception($"El producto con id {detalle.ProdId} no existe en Catálogo.");

            productosCatalogo[detalle.ProdId] = producto;
        }

        var stocksDevueltos = new List<(int ProdId, int Cantidad)>();

        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            foreach (var detalle in factura.ProductoFacturas)
            {
                var producto = productosCatalogo[detalle.ProdId];

                var kardex = new Kardex
                {
                    KdxTipo = "ENTRADA",
                    KdxMotivo = "ANULACION_VENTA",
                    KdxDocRefer = factura.FacNumeroSerie ?? $"FAC-{factura.FacId}",
                    KdxFecha = DateTime.Now,
                    ProdId = detalle.ProdId,
                    UsuId = usuId,
                    KdxCantidad = detalle.FpCantidad,
                    KdxSaldoAnt = producto.ProdCantidad,
                    KdxSaldoFinal = producto.ProdCantidad + detalle.FpCantidad,
                    KdxCostoUnit = producto.ProdPreciocom,
                    KdxPrecioUnit = producto.ProdPrecioven
                };

                _context.Kardices.Add(kardex);
            }

            factura.FacEstado = null;
            factura.UpdatedAt = DateTime.Now;
            factura.UpdatedBy = usuId;

            await _context.SaveChangesAsync();

            foreach (var detalle in factura.ProductoFacturas)
            {
                var actualizado = await _catalogoApiService.SumarStockAsync(detalle.ProdId, detalle.FpCantidad);

                if (!actualizado)
                    throw new Exception($"No se pudo devolver el stock del producto {detalle.ProdId} en Catálogo.");

                stocksDevueltos.Add((detalle.ProdId, detalle.FpCantidad));
            }

            await transaction.CommitAsync();
            return true;
        }
        catch
        {
            await transaction.RollbackAsync();

            foreach (var item in stocksDevueltos)
            {
                try
                {
                    await _catalogoApiService.RestarStockAsync(item.ProdId, item.Cantidad);
                }
                catch
                {
                }
            }

            throw;
        }
    }
}