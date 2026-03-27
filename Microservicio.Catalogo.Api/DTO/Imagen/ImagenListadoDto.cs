namespace Microservicio.Catalogo.Api.DTOs.Imagen;

public class ImagenListadoDto
{
    public int ImgId { get; set; }

    public int ProdId { get; set; }

    public string? ProdNombre { get; set; }

    public string? ImgNombre { get; set; }

    public string ImgUrl { get; set; } = null!;

    public string? ImgDescripcion { get; set; }

    public bool EsPrincipal { get; set; }

    public int Orden { get; set; }

    public bool ImgEstado { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}