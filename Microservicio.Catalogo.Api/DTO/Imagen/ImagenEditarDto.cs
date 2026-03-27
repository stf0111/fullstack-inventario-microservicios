using System.ComponentModel.DataAnnotations;

namespace Microservicio.Catalogo.Api.DTOs.Imagen;

public class ImagenEditarDto
{
    [Range(1, int.MaxValue, ErrorMessage = "El producto es obligatorio.")]
    public int ProdId { get; set; }

    [StringLength(200, ErrorMessage = "El nombre no puede superar los 200 caracteres.")]
    public string? ImgNombre { get; set; }

    [Required(ErrorMessage = "La URL de la imagen es obligatoria.")]
    [StringLength(1000, ErrorMessage = "La URL no puede superar los 1000 caracteres.")]
    public string ImgUrl { get; set; } = null!;

    [StringLength(500, ErrorMessage = "La descripción no puede superar los 500 caracteres.")]
    public string? ImgDescripcion { get; set; }

    public bool EsPrincipal { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "El orden no puede ser negativo.")]
    public int Orden { get; set; }

    public bool ImgEstado { get; set; }
}