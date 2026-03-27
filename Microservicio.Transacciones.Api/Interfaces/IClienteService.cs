using Microservicio.Transacciones.Api.DTOs.Cliente;

namespace Microservicio.Transacciones.Api.Interfaces;

public interface IClienteService
{
    Task<(IEnumerable<ClienteListadoDto> Items, int TotalRegistros)> ListarAsync(ClienteFiltroDto filtro);
    Task<ClienteListadoDto?> ObtenerPorIdAsync(int id);
    Task<ClienteListadoDto> CrearAsync(ClienteCrearDto dto, int? createdBy = null);
    Task<bool> EditarAsync(int id, ClienteEditarDto dto, int? updatedBy = null);
    Task<bool> EliminarAsync(int id, int? deletedBy = null);
}