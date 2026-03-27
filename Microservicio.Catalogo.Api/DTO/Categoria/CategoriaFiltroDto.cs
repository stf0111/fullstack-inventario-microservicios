namespace Microservicio.Catalogo.Api.DTOs.Categoria;

public class CategoriaFiltroDto
{
    public string? Nombre { get; set; }

    public int Pagina { get; set; } = 1;

    public int RegistrosPorPagina { get; set; } = 10;
}