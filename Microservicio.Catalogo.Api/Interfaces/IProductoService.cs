using Microservicio.Catalogo.Api.DTOs.Producto;

namespace Microservicio.Catalogo.Api.Interfaces;

public interface IProductoService
{
    Task<(IEnumerable<ProductoListadoDto> Items, int TotalRegistros)> ListarAsync(ProductoFiltroDto filtro);
    Task<ProductoListadoDto?> ObtenerPorIdAsync(int id);
    Task<ProductoListadoDto> CrearAsync(ProductoCrearDto dto);
    Task<bool> EditarAsync(int id, ProductoEditarDto dto);
    Task<bool> EliminarAsync(int id, int? deletedBy = null);

    Task<bool> AjustarStockAsync(int id, ProductoAjustarStockDto dto, int? updatedBy = null);
}