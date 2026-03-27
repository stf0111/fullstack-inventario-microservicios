namespace Microservicio.Transacciones.Api.DTOs.Cliente;

public class ClienteFiltroDto
{
    public string? Cedula { get; set; }

    public string? Nombre { get; set; }

    public string? Correo { get; set; }

    public int Pagina { get; set; } = 1;

    public int RegistrosPorPagina { get; set; } = 10;
}