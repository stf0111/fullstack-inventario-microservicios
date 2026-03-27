using Microsoft.EntityFrameworkCore;
using Microservicio.Transacciones.Api.Data;
using Microservicio.Transacciones.Api.DTOs.Proveedor;
using Microservicio.Transacciones.Api.Interfaces;
using Microservicio.Transacciones.Api.Models;

namespace Microservicio.Transacciones.Api.Services;

public class ProveedorService : IProveedorService
{
    private readonly TransaccionesDbContext _context;

    public ProveedorService(TransaccionesDbContext context)
    {
        _context = context;
    }

    public async Task<(IEnumerable<ProveedorListadoDto> Items, int TotalRegistros)> ListarAsync(ProveedorFiltroDto filtro)
    {
        filtro.Pagina = filtro.Pagina <= 0 ? 1 : filtro.Pagina;
        filtro.RegistrosPorPagina = filtro.RegistrosPorPagina <= 0 ? 10 : filtro.RegistrosPorPagina;

        var query = _context.Proveedors
            .AsNoTracking()
            .Where(p => p.DeletedAt == null)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filtro.Nombre))
        {
            var nombre = filtro.Nombre.Trim();
            query = query.Where(p => p.ProvNombre.Contains(nombre));
        }

        if (!string.IsNullOrWhiteSpace(filtro.Ruc))
        {
            var ruc = filtro.Ruc.Trim();
            query = query.Where(p => p.ProvRuc != null && p.ProvRuc.Contains(ruc));
        }

        if (!string.IsNullOrWhiteSpace(filtro.Correo))
        {
            var correo = filtro.Correo.Trim();
            query = query.Where(p => p.ProvCorreo != null && p.ProvCorreo.Contains(correo));
        }

        var totalRegistros = await query.CountAsync();

        var items = await query
            .OrderByDescending(p => p.ProvId)
            .Skip((filtro.Pagina - 1) * filtro.RegistrosPorPagina)
            .Take(filtro.RegistrosPorPagina)
            .Select(p => new ProveedorListadoDto
            {
                ProvId = p.ProvId,
                ProvNombre = p.ProvNombre,
                ProvRuc = p.ProvRuc,
                ProvTelefono = p.ProvTelefono,
                ProvDireccion = p.ProvDireccion,
                ProvCorreo = p.ProvCorreo,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt
            })
            .ToListAsync();

        return (items, totalRegistros);
    }

    public async Task<ProveedorListadoDto?> ObtenerPorIdAsync(int id)
    {
        var proveedor = await _context.Proveedors
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.ProvId == id && p.DeletedAt == null);

        if (proveedor == null)
            return null;

        return MapearProveedor(proveedor);
    }

    public async Task<ProveedorListadoDto> CrearAsync(ProveedorCrearDto dto, int? createdBy = null)
    {
        var ruc = string.IsNullOrWhiteSpace(dto.ProvRuc) ? null : dto.ProvRuc.Trim();

        if (!string.IsNullOrWhiteSpace(ruc))
        {
            var existeRuc = await _context.Proveedors
                .AnyAsync(p => p.ProvRuc == ruc && p.DeletedAt == null);

            if (existeRuc)
                throw new Exception("Ya existe un proveedor con ese RUC.");
        }

        var proveedor = new Proveedor
        {
            ProvNombre = dto.ProvNombre.Trim(),
            ProvRuc = ruc,
            ProvTelefono = string.IsNullOrWhiteSpace(dto.ProvTelefono) ? null : dto.ProvTelefono.Trim(),
            ProvDireccion = string.IsNullOrWhiteSpace(dto.ProvDireccion) ? null : dto.ProvDireccion.Trim(),
            ProvCorreo = string.IsNullOrWhiteSpace(dto.ProvCorreo) ? null : dto.ProvCorreo.Trim(),
            CreatedAt = DateTime.Now,
            CreatedBy = createdBy
        };

        _context.Proveedors.Add(proveedor);
        await _context.SaveChangesAsync();

        return MapearProveedor(proveedor);
    }

    public async Task<bool> EditarAsync(int id, ProveedorEditarDto dto, int? updatedBy = null)
    {
        var proveedor = await _context.Proveedors
            .FirstOrDefaultAsync(p => p.ProvId == id && p.DeletedAt == null);

        if (proveedor == null)
            return false;

        var ruc = string.IsNullOrWhiteSpace(dto.ProvRuc) ? null : dto.ProvRuc.Trim();

        if (!string.IsNullOrWhiteSpace(ruc))
        {
            var existeRuc = await _context.Proveedors
                .AnyAsync(p => p.ProvId != id && p.ProvRuc == ruc && p.DeletedAt == null);

            if (existeRuc)
                throw new Exception("Ya existe otro proveedor con ese RUC.");
        }

        proveedor.ProvNombre = dto.ProvNombre.Trim();
        proveedor.ProvRuc = ruc;
        proveedor.ProvTelefono = string.IsNullOrWhiteSpace(dto.ProvTelefono) ? null : dto.ProvTelefono.Trim();
        proveedor.ProvDireccion = string.IsNullOrWhiteSpace(dto.ProvDireccion) ? null : dto.ProvDireccion.Trim();
        proveedor.ProvCorreo = string.IsNullOrWhiteSpace(dto.ProvCorreo) ? null : dto.ProvCorreo.Trim();
        proveedor.UpdatedAt = DateTime.Now;
        proveedor.UpdatedBy = updatedBy;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> EliminarAsync(int id, int? deletedBy = null)
    {
        var proveedor = await _context.Proveedors
            .FirstOrDefaultAsync(p => p.ProvId == id && p.DeletedAt == null);

        if (proveedor == null)
            return false;

        var tieneCompras = await _context.Compras
            .AnyAsync(c => c.ProvId == id && c.DeletedAt == null);

        if (tieneCompras)
            throw new Exception("No se puede eliminar el proveedor porque tiene compras asociadas.");

        proveedor.DeletedAt = DateTime.Now;
        proveedor.DeletedBy = deletedBy;
        proveedor.UpdatedAt = DateTime.Now;
        proveedor.UpdatedBy = deletedBy;

        await _context.SaveChangesAsync();
        return true;
    }

    private static ProveedorListadoDto MapearProveedor(Proveedor proveedor)
    {
        return new ProveedorListadoDto
        {
            ProvId = proveedor.ProvId,
            ProvNombre = proveedor.ProvNombre,
            ProvRuc = proveedor.ProvRuc,
            ProvTelefono = proveedor.ProvTelefono,
            ProvDireccion = proveedor.ProvDireccion,
            ProvCorreo = proveedor.ProvCorreo,
            CreatedAt = proveedor.CreatedAt,
            UpdatedAt = proveedor.UpdatedAt
        };
    }
}