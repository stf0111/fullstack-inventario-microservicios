namespace Microservicio.Catalogo.Api.DTOs.Producto;

public class ProductoFiltroDto
{
    public string? Nombre { get; set; }

    public int? CatId { get; set; }

    public int? MarcaId { get; set; }

    public bool? ProdEstado { get; set; }

    public decimal? PrecioMin { get; set; }

    public decimal? PrecioMax { get; set; }

    public int Pagina { get; set; } = 1;

    public int RegistrosPorPagina { get; set; } = 10;
}