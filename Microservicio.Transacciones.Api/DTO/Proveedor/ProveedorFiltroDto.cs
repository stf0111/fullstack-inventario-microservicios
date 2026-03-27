namespace Microservicio.Transacciones.Api.DTOs.Proveedor;

public class ProveedorFiltroDto
{
    public string? Nombre { get; set; }

    public string? Ruc { get; set; }

    public string? Correo { get; set; }

    public int Pagina { get; set; } = 1;

    public int RegistrosPorPagina { get; set; } = 10;
}