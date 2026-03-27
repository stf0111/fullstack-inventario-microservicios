using System;
using System.Collections.Generic;
using Microservicio.Transacciones.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Microservicio.Transacciones.Api.Data;

public partial class TransaccionesDbContext : DbContext
{
    public TransaccionesDbContext()
    {
    }

    public TransaccionesDbContext(DbContextOptions<TransaccionesDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Cliente> Clientes { get; set; }

    public virtual DbSet<Compra> Compras { get; set; }

    public virtual DbSet<Factura> Facturas { get; set; }

    public virtual DbSet<Kardex> Kardices { get; set; }

    public virtual DbSet<ProductoCompra> ProductoCompras { get; set; }

    public virtual DbSet<ProductoFactura> ProductoFacturas { get; set; }

    public virtual DbSet<Proveedor> Proveedors { get; set; }

    public virtual DbSet<TipoPago> TipoPagos { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseSqlServer("Server=localhost,14330;Database=BD_TRANSACCIONES;User Id=sa;Password=TuPasswordSeguro123!;TrustServerCertificate=True;MultipleActiveResultSets=True");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Cliente>(entity =>
        {
            entity.HasKey(e => e.CliId);

            entity.ToTable("CLIENTE");

            entity.HasIndex(e => e.CliCedula, "UQ_CLI_CEDULA")
                .IsUnique()
                .HasFilter("([CLI_CEDULA] IS NOT NULL AND [DELETED_AT] IS NULL)");

            entity.Property(e => e.CliId).HasColumnName("CLI_ID");
            entity.Property(e => e.CliApellido)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("CLI_APELLIDO");
            entity.Property(e => e.CliCedula)
                .HasMaxLength(13)
                .IsUnicode(false)
                .HasColumnName("CLI_CEDULA");
            entity.Property(e => e.CliCorreo)
                .HasMaxLength(250)
                .IsUnicode(false)
                .HasColumnName("CLI_CORREO");
            entity.Property(e => e.CliDireccion)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("CLI_DIRECCION");
            entity.Property(e => e.CliNombre)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("CLI_NOMBRE");
            entity.Property(e => e.CliTelefono)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("CLI_TELEFONO");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())")
                .HasColumnName("CREATED_AT");
            entity.Property(e => e.CreatedBy).HasColumnName("CREATED_BY");
            entity.Property(e => e.DeletedAt)
                .HasPrecision(0)
                .HasColumnName("DELETED_AT");
            entity.Property(e => e.DeletedBy).HasColumnName("DELETED_BY");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(0)
                .HasColumnName("UPDATED_AT");
            entity.Property(e => e.UpdatedBy).HasColumnName("UPDATED_BY");
        });

        modelBuilder.Entity<Compra>(entity =>
        {
            entity.ToTable("COMPRA");

            entity.HasIndex(e => new { e.ProvId, e.CompraFecha }, "IX_COMPRA_PROV_FECHA");

            entity.Property(e => e.CompraId).HasColumnName("COMPRA_ID");
            entity.Property(e => e.CompraFecha).HasColumnName("COMPRA_FECHA");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())")
                .HasColumnName("CREATED_AT");
            entity.Property(e => e.CreatedBy).HasColumnName("CREATED_BY");
            entity.Property(e => e.DeletedAt)
                .HasPrecision(0)
                .HasColumnName("DELETED_AT");
            entity.Property(e => e.DeletedBy).HasColumnName("DELETED_BY");
            entity.Property(e => e.ProvId).HasColumnName("PROV_ID");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(0)
                .HasColumnName("UPDATED_AT");
            entity.Property(e => e.UpdatedBy).HasColumnName("UPDATED_BY");
            entity.Property(e => e.UsuId).HasColumnName("USU_ID");

            entity.HasOne(d => d.Prov).WithMany(p => p.Compras)
                .HasForeignKey(d => d.ProvId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_COMPRA_PROVEEDOR");
        });

        modelBuilder.Entity<Factura>(entity =>
        {
            entity.HasKey(e => e.FacId);

            entity.ToTable("FACTURA");

            entity.HasIndex(e => new { e.CliId, e.FacFecha }, "IX_FAC_CLI_FECHA");

            entity.HasIndex(e => new { e.TpaId, e.FacFecha }, "IX_FAC_TPA_FECHA");

            entity.HasIndex(e => new { e.UsuId, e.FacFecha }, "IX_FAC_USU_FECHA");

            entity.HasIndex(e => e.FacNumeroSerie, "UQ_FAC_NUMERO_SERIE")
                .IsUnique()
                .HasFilter("([FAC_NUMERO_SERIE] IS NOT NULL)");

            entity.Property(e => e.FacId).HasColumnName("FAC_ID");
            entity.Property(e => e.CliId).HasColumnName("CLI_ID");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())")
                .HasColumnName("CREATED_AT");
            entity.Property(e => e.CreatedBy).HasColumnName("CREATED_BY");
            entity.Property(e => e.DeletedAt)
                .HasPrecision(0)
                .HasColumnName("DELETED_AT");
            entity.Property(e => e.DeletedBy).HasColumnName("DELETED_BY");
            entity.Property(e => e.FacEstado)
                .HasDefaultValue(true)
                .HasColumnName("FAC_ESTADO");
            entity.Property(e => e.FacFecha).HasColumnName("FAC_FECHA");
            entity.Property(e => e.FacIvaValor)
                .HasColumnType("decimal(10, 2)")
                .HasColumnName("FAC_IVA_VALOR");
            entity.Property(e => e.FacNumeroSerie)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("FAC_NUMERO_SERIE");
            entity.Property(e => e.FacSubtotal)
                .HasColumnType("decimal(10, 2)")
                .HasColumnName("FAC_SUBTOTAL");
            entity.Property(e => e.FacTotal)
                .HasColumnType("decimal(10, 2)")
                .HasColumnName("FAC_TOTAL");
            entity.Property(e => e.TpaId).HasColumnName("TPA_ID");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(0)
                .HasColumnName("UPDATED_AT");
            entity.Property(e => e.UpdatedBy).HasColumnName("UPDATED_BY");
            entity.Property(e => e.UsuId).HasColumnName("USU_ID");

            entity.HasOne(d => d.Cli).WithMany(p => p.Facturas)
                .HasForeignKey(d => d.CliId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_FACTURA_CLIENTE");

            entity.HasOne(d => d.Tpa).WithMany(p => p.Facturas)
                .HasForeignKey(d => d.TpaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_FACTURA_TIPO_PAGO");
        });

        modelBuilder.Entity<Kardex>(entity =>
        {
            entity.HasKey(e => e.KdxId);

            entity.ToTable("KARDEX");

            entity.HasIndex(e => new { e.ProdId, e.KdxFecha }, "IX_KDX_PROD_FECHA");

            entity.HasIndex(e => new { e.UsuId, e.KdxFecha }, "IX_KDX_USU_FECHA");

            entity.Property(e => e.KdxId).HasColumnName("KDX_ID");
            entity.Property(e => e.KdxCantidad).HasColumnName("KDX_CANTIDAD");
            entity.Property(e => e.KdxCostoUnit)
                .HasColumnType("decimal(10, 2)")
                .HasColumnName("KDX_COSTO_UNIT");
            entity.Property(e => e.KdxDocRefer)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("KDX_DOC_REFER");
            entity.Property(e => e.KdxFecha)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())")
                .HasColumnName("KDX_FECHA");
            entity.Property(e => e.KdxMotivo)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("KDX_MOTIVO");
            entity.Property(e => e.KdxPrecioUnit)
                .HasColumnType("decimal(10, 2)")
                .HasColumnName("KDX_PRECIO_UNIT");
            entity.Property(e => e.KdxSaldoAnt).HasColumnName("KDX_SALDO_ANT");
            entity.Property(e => e.KdxSaldoFinal).HasColumnName("KDX_SALDO_FINAL");
            entity.Property(e => e.KdxTipo)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("KDX_TIPO");
            entity.Property(e => e.ProdId).HasColumnName("PROD_ID");
            entity.Property(e => e.UsuId).HasColumnName("USU_ID");
        });

        modelBuilder.Entity<ProductoCompra>(entity =>
        {
            entity.HasKey(e => new { e.CompraId, e.ProdId });

            entity.ToTable("PRODUCTO_COMPRA");

            entity.HasIndex(e => e.ProdId, "IX_PRDCOM_PROD");

            entity.Property(e => e.CompraId).HasColumnName("COMPRA_ID");
            entity.Property(e => e.ProdId).HasColumnName("PROD_ID");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())")
                .HasColumnName("CREATED_AT");
            entity.Property(e => e.CreatedBy).HasColumnName("CREATED_BY");
            entity.Property(e => e.DeletedAt)
                .HasPrecision(0)
                .HasColumnName("DELETED_AT");
            entity.Property(e => e.DeletedBy).HasColumnName("DELETED_BY");
            entity.Property(e => e.PrdcomCantidad).HasColumnName("PRDCOM_CANTIDAD");
            entity.Property(e => e.PrdcomPrecio)
                .HasColumnType("decimal(10, 2)")
                .HasColumnName("PRDCOM_PRECIO");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(0)
                .HasColumnName("UPDATED_AT");
            entity.Property(e => e.UpdatedBy).HasColumnName("UPDATED_BY");

            entity.HasOne(d => d.Compra).WithMany(p => p.ProductoCompras)
                .HasForeignKey(d => d.CompraId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PRDCOM_COMPRA");
        });

        modelBuilder.Entity<ProductoFactura>(entity =>
        {
            entity.HasKey(e => new { e.FacId, e.ProdId });

            entity.ToTable("PRODUCTO_FACTURA");

            entity.HasIndex(e => e.ProdId, "IX_FP_PROD");

            entity.Property(e => e.FacId).HasColumnName("FAC_ID");
            entity.Property(e => e.ProdId).HasColumnName("PROD_ID");
            entity.Property(e => e.FpCantidad).HasColumnName("FP_CANTIDAD");
            entity.Property(e => e.FpPrecio)
                .HasColumnType("decimal(10, 2)")
                .HasColumnName("FP_PRECIO");

            entity.HasOne(d => d.Fac).WithMany(p => p.ProductoFacturas)
                .HasForeignKey(d => d.FacId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PF_FACTURA");
        });

        modelBuilder.Entity<Proveedor>(entity =>
        {
            entity.HasKey(e => e.ProvId);

            entity.ToTable("PROVEEDOR");

            entity.HasIndex(e => e.ProvRuc, "UQ_PROV_RUC")
                .IsUnique()
                .HasFilter("([PROV_RUC] IS NOT NULL AND [DELETED_AT] IS NULL)");

            entity.Property(e => e.ProvId).HasColumnName("PROV_ID");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())")
                .HasColumnName("CREATED_AT");
            entity.Property(e => e.CreatedBy).HasColumnName("CREATED_BY");
            entity.Property(e => e.DeletedAt)
                .HasPrecision(0)
                .HasColumnName("DELETED_AT");
            entity.Property(e => e.DeletedBy).HasColumnName("DELETED_BY");
            entity.Property(e => e.ProvCorreo)
                .HasMaxLength(250)
                .IsUnicode(false)
                .HasColumnName("PROV_CORREO");
            entity.Property(e => e.ProvDireccion)
                .HasMaxLength(250)
                .IsUnicode(false)
                .HasColumnName("PROV_DIRECCION");
            entity.Property(e => e.ProvNombre)
                .HasMaxLength(150)
                .IsUnicode(false)
                .HasColumnName("PROV_NOMBRE");
            entity.Property(e => e.ProvRuc)
                .HasMaxLength(13)
                .IsUnicode(false)
                .HasColumnName("PROV_RUC");
            entity.Property(e => e.ProvTelefono)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasColumnName("PROV_TELEFONO");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(0)
                .HasColumnName("UPDATED_AT");
            entity.Property(e => e.UpdatedBy).HasColumnName("UPDATED_BY");
        });

        modelBuilder.Entity<TipoPago>(entity =>
        {
            entity.HasKey(e => e.TpaId);

            entity.ToTable("TIPO_PAGO");

            entity.HasIndex(e => e.TpaNombre, "UQ_TPA_NOMBRE")
                .IsUnique()
                .HasFilter("([DELETED_AT] IS NULL)");

            entity.Property(e => e.TpaId).HasColumnName("TPA_ID");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())")
                .HasColumnName("CREATED_AT");
            entity.Property(e => e.CreatedBy).HasColumnName("CREATED_BY");
            entity.Property(e => e.DeletedAt)
                .HasPrecision(0)
                .HasColumnName("DELETED_AT");
            entity.Property(e => e.DeletedBy).HasColumnName("DELETED_BY");
            entity.Property(e => e.TpaNombre)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("TPA_NOMBRE");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(0)
                .HasColumnName("UPDATED_AT");
            entity.Property(e => e.UpdatedBy).HasColumnName("UPDATED_BY");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
