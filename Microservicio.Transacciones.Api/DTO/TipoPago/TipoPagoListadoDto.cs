namespace Microservicio.Transacciones.Api.DTOs.TipoPago;

public class TipoPagoListadoDto
{
    public int TpaId { get; set; }

    public string TpaNombre { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}