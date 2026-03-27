using System;
using System.Collections.Generic;

namespace Microservicio.Catalogo.Api.Models;

public partial class Imagen
{
    public int ImgId { get; set; }

    public int ProdId { get; set; }

    public string? ImgNombre { get; set; }

    public string ImgUrl { get; set; } = null!;

    public string? ImgDescripcion { get; set; }

    public bool EsPrincipal { get; set; }

    public int Orden { get; set; }

    public bool ImgEstado { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? DeletedAt { get; set; }

    public int? CreatedBy { get; set; }

    public int? UpdatedBy { get; set; }

    public int? DeletedBy { get; set; }

    public virtual Usuario? CreatedByNavigation { get; set; }

    public virtual Usuario? DeletedByNavigation { get; set; }

    public virtual Producto Prod { get; set; } = null!;

    public virtual Usuario? UpdatedByNavigation { get; set; }
}
