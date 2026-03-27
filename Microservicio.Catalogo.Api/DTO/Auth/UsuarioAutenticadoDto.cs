namespace Microservicio.Catalogo.Api.DTOs.Auth;

public class UsuarioAutenticadoDto
{
    public int UsuId { get; set; }

    public string UsuCedula { get; set; } = null!;

    public string UsuNombreCompleto { get; set; } = null!;

    public string UsuRol { get; set; } = null!;

    public bool UsuEstado { get; set; }
}