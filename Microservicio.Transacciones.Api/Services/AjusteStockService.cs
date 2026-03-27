using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microservicio.Transacciones.Api.Data;
using Microservicio.Transacciones.Api.DTOs.AjusteStock;
using Microservicio.Transacciones.Api.DTOs.Shared;
using Microservicio.Transacciones.Api.Interfaces;
using Microservicio.Transacciones.Api.Models;

namespace Microservicio.Transacciones.Api.Services;

public class AjusteStockService : IAjusteStockService
{
    private readonly TransaccionesDbContext _context;
    private readonly ICatalogoApiService _catalogoApiService;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AjusteStockService(
        TransaccionesDbContext context,
        ICatalogoApiService catalogoApiService,
        IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _catalogoApiService = catalogoApiService;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<ApiResponseDto<AjusteStockResponseDto>> AjustarAsync(int prodId, AjusteStockRequestDto dto)
    {
        if (prodId <= 0)
            throw new ArgumentException("El producto es inválido.");

        if (dto is null)
            throw new ArgumentException("No se recibió la información del ajuste.");

        if (dto.NuevoStock < 0)
            throw new ArgumentException("El nuevo stock no puede ser negativo.");

        var usuId = ObtenerUsuarioId();
        if (usuId is null || usuId <= 0)
            throw new InvalidOperationException("No se pudo identificar el usuario autenticado.");

        var producto = await _catalogoApiService.ObtenerProductoAsync(prodId);
        if (producto is null)
            throw new InvalidOperationException("No se encontró el producto en catálogo.");

        var stockAnterior = producto.ProdCantidad;
        var nuevoStock = dto.NuevoStock;
        var diferencia = nuevoStock - stockAnterior;

        if (diferencia == 0)
            throw new InvalidOperationException("El nuevo stock es igual al stock actual. No hay cambios para registrar.");

        var motivo = string.IsNullOrWhiteSpace(dto.Motivo)
            ? "Ajuste manual"
            : dto.Motivo.Trim();

        var documentoReferencia = string.IsNullOrWhiteSpace(dto.DocumentoReferencia)
            ? null
            : dto.DocumentoReferencia.Trim();

        var operacion = diferencia > 0 ? "SUMAR" : "RESTAR";
        var cantidadMovimiento = Math.Abs(diferencia);

        var stockActualizadoEnCatalogo = false;

        try
        {
            bool okCatalogo;

            if (diferencia > 0)
                okCatalogo = await _catalogoApiService.SumarStockAsync(prodId, cantidadMovimiento);
            else
                okCatalogo = await _catalogoApiService.RestarStockAsync(prodId, cantidadMovimiento);

            if (!okCatalogo)
                throw new InvalidOperationException("No se pudo actualizar el stock en el microservicio de catálogo.");

            stockActualizadoEnCatalogo = true;

            var kardex = new Kardex
            {
                ProdId = prodId,
                UsuId = usuId.Value,
                KdxFecha = DateTime.Now,
                KdxTipo = "Ajuste",
                KdxMotivo = motivo.Length > 30 ? motivo[..30] : motivo,
                KdxDocRefer = documentoReferencia is null
                    ? null
                    : (documentoReferencia.Length > 50 ? documentoReferencia[..50] : documentoReferencia),
                KdxCantidad = cantidadMovimiento,
                KdxSaldoAnt = stockAnterior,
                KdxSaldoFinal = nuevoStock,
                KdxCostoUnit = producto.ProdPreciocom,
                KdxPrecioUnit = producto.ProdPrecioven
            };

            _context.Kardices.Add(kardex);
            await _context.SaveChangesAsync();

            return new ApiResponseDto<AjusteStockResponseDto>
            {
                Mensaje = "Ajuste de stock registrado correctamente.",
                Datos = new AjusteStockResponseDto
                {
                    ProdId = prodId,
                    ProdNombre = producto.ProdNombre,
                    StockAnterior = stockAnterior,
                    NuevoStock = nuevoStock,
                    Diferencia = diferencia,
                    OperacionAplicada = operacion,
                    KardexId = kardex.KdxId
                }
            };
        }
        catch
        {
            if (stockActualizadoEnCatalogo)
                await IntentarCompensacionAsync(prodId, diferencia);

            throw;
        }
    }

    private async Task IntentarCompensacionAsync(int prodId, int diferencia)
    {
        try
        {
            var cantidad = Math.Abs(diferencia);

            if (diferencia > 0)
                await _catalogoApiService.RestarStockAsync(prodId, cantidad);
            else
                await _catalogoApiService.SumarStockAsync(prodId, cantidad);
        }
        catch
        {
        }
    }

    private int? ObtenerUsuarioId()
    {
        var user = _httpContextAccessor.HttpContext?.User;
        if (user is null) return null;

        var posiblesClaims = new[]
        {
            "usuId",
            ClaimTypes.NameIdentifier,
            "sub"
        };

        foreach (var claimType in posiblesClaims)
        {
            var valor = user.FindFirst(claimType)?.Value;
            if (int.TryParse(valor, out var id) && id > 0)
                return id;
        }

        return null;
    }
}