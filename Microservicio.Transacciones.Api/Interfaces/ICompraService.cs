using Microservicio.Transacciones.Api.DTOs.Compra;

namespace Microservicio.Transacciones.Api.Interfaces;

public interface ICompraService
{
    Task<(IEnumerable<CompraDto> Items, int TotalRegistros)> ListarAsync(CompraFiltroDto filtro);
    Task<CompraDto?> ObtenerPorIdAsync(int id);
    Task<CompraDto> CrearAsync(CompraCrearDto dto, int usuId);
}