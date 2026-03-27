using Microservicio.Catalogo.Api.DTOs.Usuario;

namespace Microservicio.Catalogo.Api.Interfaces;

public interface IUsuarioService
{
    Task<(IEnumerable<UsuarioListadoDto> Items, int TotalRegistros)> ListarAsync(UsuarioFiltroDto filtro);
    Task<UsuarioListadoDto?> ObtenerPorIdAsync(int id);
    Task<UsuarioListadoDto> CrearAsync(UsuarioCrearDto dto, int? createdBy = null);
    Task<bool> EditarAsync(int id, UsuarioEditarDto dto, int? updatedBy = null);
    Task<bool> EliminarAsync(int id, int? deletedBy = null);
}