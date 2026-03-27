using Microservicio.Transacciones.Api.DTOs.Proveedor;

namespace Microservicio.Transacciones.Api.Interfaces;

public interface IProveedorService
{
    Task<(IEnumerable<ProveedorListadoDto> Items, int TotalRegistros)> ListarAsync(ProveedorFiltroDto filtro);
    Task<ProveedorListadoDto?> ObtenerPorIdAsync(int id);
    Task<ProveedorListadoDto> CrearAsync(ProveedorCrearDto dto, int? createdBy = null);
    Task<bool> EditarAsync(int id, ProveedorEditarDto dto, int? updatedBy = null);
    Task<bool> EliminarAsync(int id, int? deletedBy = null);
}