namespace Microservicio.Catalogo.Api.DTOs.Auth;

public class LoginResponseDto
{
    public string Token { get; set; } = null!;

    public DateTime Expiracion { get; set; }

    public UsuarioAutenticadoDto Usuario { get; set; } = null!;
}