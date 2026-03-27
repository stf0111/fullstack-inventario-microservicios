using System;
using System.Collections.Generic;

namespace Microservicio.Transacciones.Api.Models;

public partial class Factura
{
    public int FacId { get; set; }

    public int CliId { get; set; }

    public int? UsuId { get; set; }

    public int TpaId { get; set; }

    public DateOnly FacFecha { get; set; }

    public string? FacNumeroSerie { get; set; }

    public decimal FacSubtotal { get; set; }

    public decimal FacIvaValor { get; set; }

    public decimal FacTotal { get; set; }

    public bool? FacEstado { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? DeletedAt { get; set; }

    public int? CreatedBy { get; set; }

    public int? UpdatedBy { get; set; }

    public int? DeletedBy { get; set; }

    public virtual Cliente? Cli { get; set; } = null!;

    public virtual ICollection<ProductoFactura> ProductoFacturas { get; set; } = new List<ProductoFactura>();

    public virtual TipoPago? Tpa { get; set; } = null!;
}
