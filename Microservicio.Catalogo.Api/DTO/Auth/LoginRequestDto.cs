using System.ComponentModel.DataAnnotations;

namespace Microservicio.Catalogo.Api.DTOs.Auth;

public class LoginRequestDto
{
    [Required(ErrorMessage = "La cédula es obligatoria.")]
    [StringLength(10, MinimumLength = 10, ErrorMessage = "La cédula debe tener 10 dígitos.")]
    public string UsuCedula { get; set; } = null!;

    [Required(ErrorMessage = "La contraseña es obligatoria.")]
    public string Password { get; set; } = null!;
}