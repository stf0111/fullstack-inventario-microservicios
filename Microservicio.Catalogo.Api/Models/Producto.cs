using System;
using System.Collections.Generic;

namespace Microservicio.Catalogo.Api.Models;

public partial class Producto
{
    public int ProdId { get; set; }

    public string ProdNombre { get; set; } = null!;

    public string? ProdDescripcion { get; set; }

    public int CatId { get; set; }

    public int MarcaId { get; set; }

    public decimal ProdPrecioven { get; set; }

    public decimal ProdPreciocom { get; set; }

    public int ProdCantidad { get; set; }

    public bool ProdEstado { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? DeletedAt { get; set; }

    public int? CreatedBy { get; set; }

    public int? UpdatedBy { get; set; }

    public int? DeletedBy { get; set; }

    public virtual Categorium? Cat { get; set; } = null!;

    public virtual Usuario? CreatedByNavigation { get; set; }

    public virtual Usuario? DeletedByNavigation { get; set; }

    public virtual ICollection<Imagen> Imagens { get; set; } = new List<Imagen>();

    public virtual Marca? Marca { get; set; } = null!;

    public virtual Usuario? UpdatedByNavigation { get; set; }
}
