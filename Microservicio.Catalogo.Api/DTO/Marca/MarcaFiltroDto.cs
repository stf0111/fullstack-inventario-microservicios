namespace Microservicio.Catalogo.Api.DTOs.Marca;

public class MarcaFiltroDto
{
    public string? Nombre { get; set; }

    public int Pagina { get; set; } = 1;

    public int RegistrosPorPagina { get; set; } = 10;
}