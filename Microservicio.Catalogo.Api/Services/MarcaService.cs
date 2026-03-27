using Microsoft.EntityFrameworkCore;
using Microservicio.Catalogo.Api.Data;
using Microservicio.Catalogo.Api.DTOs.Marca;
using Microservicio.Catalogo.Api.Interfaces;
using Microservicio.Catalogo.Api.Models;

namespace Microservicio.Catalogo.Api.Services;

public class MarcaService : IMarcaService
{
    private readonly CatalogoDbContext _context;

    public MarcaService(CatalogoDbContext context)
    {
        _context = context;
    }

    public async Task<(IEnumerable<MarcaListadoDto> Items, int TotalRegistros)> ListarAsync(MarcaFiltroDto filtro)
    {
        filtro.Pagina = filtro.Pagina <= 0 ? 1 : filtro.Pagina;
        filtro.RegistrosPorPagina = filtro.RegistrosPorPagina <= 0 ? 10 : filtro.RegistrosPorPagina;

        var query = _context.Marcas
            .AsNoTracking()
            .Where(m => m.DeletedAt == null)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filtro.Nombre))
        {
            var nombre = filtro.Nombre.Trim();
            query = query.Where(m => m.MarcaNombre.Contains(nombre));
        }

        var totalRegistros = await query.CountAsync();

        var items = await query
            .OrderByDescending(m => m.MarcaId)
            .Skip((filtro.Pagina - 1) * filtro.RegistrosPorPagina)
            .Take(filtro.RegistrosPorPagina)
            .Select(m => new MarcaListadoDto
            {
                MarcaId = m.MarcaId,
                MarcaNombre = m.MarcaNombre,
                CreatedAt = m.CreatedAt,
                UpdatedAt = m.UpdatedAt
            })
            .ToListAsync();

        return (items, totalRegistros);
    }

    public async Task<MarcaListadoDto?> ObtenerPorIdAsync(int id)
    {
        var marca = await _context.Marcas
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.MarcaId == id && m.DeletedAt == null);

        if (marca == null)
            return null;

        return new MarcaListadoDto
        {
            MarcaId = marca.MarcaId,
            MarcaNombre = marca.MarcaNombre,
            CreatedAt = marca.CreatedAt,
            UpdatedAt = marca.UpdatedAt
        };
    }

    public async Task<MarcaListadoDto> CrearAsync(MarcaCrearDto dto)
    {
        var existe = await _context.Marcas
            .AnyAsync(m => m.MarcaNombre == dto.MarcaNombre.Trim() && m.DeletedAt == null);

        if (existe)
            throw new Exception("Ya existe una marca con ese nombre.");

        var marca = new Marca
        {
            MarcaNombre = dto.MarcaNombre.Trim(),
            CreatedAt = DateTime.Now
        };

        _context.Marcas.Add(marca);
        await _context.SaveChangesAsync();

        return new MarcaListadoDto
        {
            MarcaId = marca.MarcaId,
            MarcaNombre = marca.MarcaNombre,
            CreatedAt = marca.CreatedAt,
            UpdatedAt = marca.UpdatedAt
        };
    }

    public async Task<bool> EditarAsync(int id, MarcaEditarDto dto)
    {
        var marca = await _context.Marcas
            .FirstOrDefaultAsync(m => m.MarcaId == id && m.DeletedAt == null);

        if (marca == null)
            return false;

        var nombre = dto.MarcaNombre.Trim();

        var existe = await _context.Marcas
            .AnyAsync(m => m.MarcaId != id && m.MarcaNombre == nombre && m.DeletedAt == null);

        if (existe)
            throw new Exception("Ya existe otra marca con ese nombre.");

        marca.MarcaNombre = nombre;
        marca.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> EliminarAsync(int id, int? deletedBy = null)
    {
        var marca = await _context.Marcas
            .Include(m => m.Productos)
            .FirstOrDefaultAsync(m => m.MarcaId == id && m.DeletedAt == null);

        if (marca == null)
            return false;

        var tieneProductosActivos = marca.Productos.Any(p => p.DeletedAt == null);

        if (tieneProductosActivos)
            throw new Exception("No se puede eliminar la marca porque tiene productos asociados.");

        marca.DeletedAt = DateTime.Now;
        marca.DeletedBy = deletedBy;
        marca.UpdatedAt = DateTime.Now;
        marca.UpdatedBy = deletedBy;

        await _context.SaveChangesAsync();
        return true;
    }
}