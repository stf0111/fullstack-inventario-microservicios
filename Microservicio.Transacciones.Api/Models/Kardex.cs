using System;
using System.Collections.Generic;

namespace Microservicio.Transacciones.Api.Models;

public partial class Kardex
{
    public int KdxId { get; set; }

    public int ProdId { get; set; }

    public int UsuId { get; set; }

    public DateTime KdxFecha { get; set; }

    public string KdxTipo { get; set; } = null!;

    public string? KdxMotivo { get; set; }

    public string? KdxDocRefer { get; set; }

    public int KdxCantidad { get; set; }

    public int? KdxSaldoAnt { get; set; }

    public int? KdxSaldoFinal { get; set; }

    public decimal? KdxCostoUnit { get; set; }

    public decimal? KdxPrecioUnit { get; set; }
}
