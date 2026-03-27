using System.ComponentModel.DataAnnotations;

namespace Microservicio.Catalogo.Api.DTOs.Usuario;

public class UsuarioCrearDto
{
    [Required(ErrorMessage = "La cédula es obligatoria.")]
    [StringLength(10, MinimumLength = 10, ErrorMessage = "La cédula debe tener 10 dígitos.")]
    public string UsuCedula { get; set; } = null!;

    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [StringLength(100, ErrorMessage = "El nombre no puede superar los 100 caracteres.")]
    public string UsuNombre { get; set; } = null!;

    [Required(ErrorMessage = "El apellido es obligatorio.")]
    [StringLength(100, ErrorMessage = "El apellido no puede superar los 100 caracteres.")]
    public string UsuApellido { get; set; } = null!;

    [Required(ErrorMessage = "El rol es obligatorio.")]
    public string UsuRol { get; set; } = null!;

    public bool UsuEstado { get; set; } = true;

    [Required(ErrorMessage = "La contraseña es obligatoria.")]
    [MinLength(6, ErrorMessage = "La contraseña debe tener al menos 6 caracteres.")]
    public string Password { get; set; } = null!;
}