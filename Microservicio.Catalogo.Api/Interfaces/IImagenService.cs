using Microservicio.Catalogo.Api.DTOs.Imagen;

namespace Microservicio.Catalogo.Api.Interfaces;

public interface IImagenService
{
    Task<(IEnumerable<ImagenListadoDto> Items, int TotalRegistros)> ListarAsync(ImagenFiltroDto filtro);
    Task<ImagenListadoDto?> ObtenerPorIdAsync(int id);
    Task<ImagenListadoDto> CrearAsync(ImagenCrearDto dto);
    Task<bool> EditarAsync(int id, ImagenEditarDto dto);
    Task<bool> EliminarAsync(int id, int? deletedBy = null);
}