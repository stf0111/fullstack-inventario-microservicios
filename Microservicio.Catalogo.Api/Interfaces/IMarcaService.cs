using Microservicio.Catalogo.Api.DTOs.Marca;

namespace Microservicio.Catalogo.Api.Interfaces;

public interface IMarcaService
{
    Task<(IEnumerable<MarcaListadoDto> Items, int TotalRegistros)> ListarAsync(MarcaFiltroDto filtro);
    Task<MarcaListadoDto?> ObtenerPorIdAsync(int id);
    Task<MarcaListadoDto> CrearAsync(MarcaCrearDto dto);
    Task<bool> EditarAsync(int id, MarcaEditarDto dto);
    Task<bool> EliminarAsync(int id, int? deletedBy = null);
}