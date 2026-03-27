using System;
using System.Collections.Generic;

namespace Microservicio.Transacciones.Api.Models;

public partial class ProductoFactura
{
    public int FacId { get; set; }

    public int ProdId { get; set; }

    public int FpCantidad { get; set; }

    public decimal FpPrecio { get; set; }

    public virtual Factura? Fac { get; set; } = null!;
}
