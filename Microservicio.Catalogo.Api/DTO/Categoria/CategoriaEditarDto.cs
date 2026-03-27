using System.ComponentModel.DataAnnotations;

namespace Microservicio.Catalogo.Api.DTOs.Categoria;

public class CategoriaEditarDto
{
    [Required(ErrorMessage = "El nombre de la categoría es obligatorio.")]
    [StringLength(150, ErrorMessage = "El nombre no puede superar los 150 caracteres.")]
    public string CatNombre { get; set; } = null!;
}