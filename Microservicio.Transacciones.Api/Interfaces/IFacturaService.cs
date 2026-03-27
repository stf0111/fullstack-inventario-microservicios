using Microservicio.Transacciones.Api.DTOs.Factura;

namespace Microservicio.Transacciones.Api.Interfaces;

public interface IFacturaService
{
    Task<(IEnumerable<FacturaDto> Items, int TotalRegistros)> ListarAsync(FacturaFiltroDto filtro);
    Task<FacturaDto?> ObtenerPorIdAsync(int id);
    Task<FacturaDto> CrearAsync(FacturaCrearDto dto, int usuId);

    Task<bool> AnularAsync(int id, int usuId);
}