namespace Microservicio.Catalogo.Api.DTOs.Usuario;

public class UsuarioFiltroDto
{
    public string? Cedula { get; set; }

    public string? Nombre { get; set; }

    public string? Rol { get; set; }

    public bool? UsuEstado { get; set; }

    public int Pagina { get; set; } = 1;

    public int RegistrosPorPagina { get; set; } = 10;
}