namespace Microservicio.Catalogo.Api.DTOs.Usuario;

public class UsuarioListadoDto
{
    public int UsuId { get; set; }

    public string UsuCedula { get; set; } = null!;

    public string UsuNombre { get; set; } = null!;

    public string UsuApellido { get; set; } = null!;

    public string UsuNombreCompleto { get; set; } = null!;

    public string UsuRol { get; set; } = null!;

    public bool UsuEstado { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}