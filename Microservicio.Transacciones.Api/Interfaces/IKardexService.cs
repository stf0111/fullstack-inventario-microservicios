using Microservicio.Transacciones.Api.DTOs.Kardex;

namespace Microservicio.Transacciones.Api.Interfaces;

public interface IKardexService
{
    Task<(IEnumerable<KardexListadoDto> Items, int TotalRegistros)> ListarAsync(KardexFiltroDto filtro);
    Task<KardexListadoDto?> ObtenerPorIdAsync(int id);
}