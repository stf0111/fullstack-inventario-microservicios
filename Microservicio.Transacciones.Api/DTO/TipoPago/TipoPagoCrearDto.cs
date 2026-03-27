using System.ComponentModel.DataAnnotations;

namespace Microservicio.Transacciones.Api.DTOs.TipoPago;

public class TipoPagoCrearDto
{
    [Required(ErrorMessage = "El nombre del tipo de pago es obligatorio.")]
    [StringLength(30, ErrorMessage = "El nombre no puede superar los 30 caracteres.")]
    public string TpaNombre { get; set; } = null!;
}