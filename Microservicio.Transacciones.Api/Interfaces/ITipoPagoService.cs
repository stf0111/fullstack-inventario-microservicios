using Microservicio.Transacciones.Api.DTOs.TipoPago;

namespace Microservicio.Transacciones.Api.Interfaces;

public interface ITipoPagoService
{
    Task<(IEnumerable<TipoPagoListadoDto> Items, int TotalRegistros)> ListarAsync(TipoPagoFiltroDto filtro);
    Task<TipoPagoListadoDto?> ObtenerPorIdAsync(int id);
    Task<TipoPagoListadoDto> CrearAsync(TipoPagoCrearDto dto, int? createdBy = null);
    Task<bool> EditarAsync(int id, TipoPagoEditarDto dto, int? updatedBy = null);
    Task<bool> EliminarAsync(int id, int? deletedBy = null);
}