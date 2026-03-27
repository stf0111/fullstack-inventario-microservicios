using Microservicio.Catalogo.Api.DTOs.Configuracion;

namespace Microservicio.Catalogo.Api.Interfaces;

public interface IConfiguracionService
{
    Task<ConfiguracionDto?> ObtenerAsync();
    Task<ConfiguracionDto> CrearAsync(ConfiguracionCrearDto dto);
    Task<bool> EditarAsync(int id, ConfiguracionEditarDto dto);
}