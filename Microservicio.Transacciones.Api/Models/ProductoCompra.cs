using System;
using System.Collections.Generic;

namespace Microservicio.Transacciones.Api.Models;

public partial class ProductoCompra
{
    public int CompraId { get; set; }

    public int ProdId { get; set; }

    public int PrdcomCantidad { get; set; }

    public decimal PrdcomPrecio { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? DeletedAt { get; set; }

    public int? CreatedBy { get; set; }

    public int? UpdatedBy { get; set; }

    public int? DeletedBy { get; set; }

    public virtual Compra? Compra { get; set; } = null!;
}
