using Microservicio.Catalogo.Api.DTOs.Auth;

namespace Microservicio.Catalogo.Api.Interfaces;

public interface IAuthService
{
    Task<LoginResponseDto?> LoginAsync(LoginRequestDto dto);
    Task<UsuarioAutenticadoDto?> ObtenerPerfilAsync(int usuId);
}