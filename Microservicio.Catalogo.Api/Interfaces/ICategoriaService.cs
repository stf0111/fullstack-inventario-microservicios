using Microservicio.Catalogo.Api.DTOs.Categoria;

namespace Microservicio.Catalogo.Api.Interfaces;

public interface ICategoriaService
{
    Task<(IEnumerable<CategoriaListadoDto> Items, int TotalRegistros)> ListarAsync(CategoriaFiltroDto filtro);
    Task<CategoriaListadoDto?> ObtenerPorIdAsync(int id);
    Task<CategoriaListadoDto> CrearAsync(CategoriaCrearDto dto);
    Task<bool> EditarAsync(int id, CategoriaEditarDto dto);
    Task<bool> EliminarAsync(int id, int? deletedBy = null);
}