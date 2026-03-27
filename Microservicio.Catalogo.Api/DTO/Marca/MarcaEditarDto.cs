using System.ComponentModel.DataAnnotations;

namespace Microservicio.Catalogo.Api.DTOs.Marca;

public class MarcaEditarDto
{
    [Required(ErrorMessage = "El nombre de la marca es obligatorio.")]
    [StringLength(150, ErrorMessage = "El nombre no puede superar los 150 caracteres.")]
    public string MarcaNombre { get; set; } = null!;
}