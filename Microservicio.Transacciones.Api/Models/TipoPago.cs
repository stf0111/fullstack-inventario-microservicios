using System;
using System.Collections.Generic;

namespace Microservicio.Transacciones.Api.Models;

public partial class TipoPago
{
    public int TpaId { get; set; }

    public string TpaNombre { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? DeletedAt { get; set; }

    public int? CreatedBy { get; set; }

    public int? UpdatedBy { get; set; }

    public int? DeletedBy { get; set; }

    public virtual ICollection<Factura> Facturas { get; set; } = new List<Factura>();
}
