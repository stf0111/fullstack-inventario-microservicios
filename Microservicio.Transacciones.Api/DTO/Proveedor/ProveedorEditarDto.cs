using System.ComponentModel.DataAnnotations;

namespace Microservicio.Transacciones.Api.DTOs.Proveedor;

public class ProveedorEditarDto
{
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [StringLength(150, ErrorMessage = "El nombre no puede superar los 150 caracteres.")]
    public string ProvNombre { get; set; } = null!;

    [StringLength(13, ErrorMessage = "El RUC no puede superar los 13 caracteres.")]
    public string? ProvRuc { get; set; }

    [StringLength(15, ErrorMessage = "El teléfono no puede superar los 15 caracteres.")]
    public string? ProvTelefono { get; set; }

    [StringLength(250, ErrorMessage = "La dirección no puede superar los 250 caracteres.")]
    public string? ProvDireccion { get; set; }

    [StringLength(250, ErrorMessage = "El correo no puede superar los 250 caracteres.")]
    [EmailAddress(ErrorMessage = "El correo no tiene un formato válido.")]
    public string? ProvCorreo { get; set; }
}