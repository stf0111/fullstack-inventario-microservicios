namespace Microservicio.Catalogo.Api.DTOs.Imagen;

public class ImagenFiltroDto
{
    public int? ProdId { get; set; }

    public bool? EsPrincipal { get; set; }

    public bool? ImgEstado { get; set; }

    public int Pagina { get; set; } = 1;

    public int RegistrosPorPagina { get; set; } = 10;
}