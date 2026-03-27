using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microservicio.Catalogo.Api.Data;
using Microservicio.Catalogo.Api.DTOs.Usuario;
using Microservicio.Catalogo.Api.Interfaces;
using Microservicio.Catalogo.Api.Models;

namespace Microservicio.Catalogo.Api.Services;

public class UsuarioService : IUsuarioService
{
    private readonly CatalogoDbContext _context;
    private readonly PasswordHasher<Usuario> _passwordHasher;

    public UsuarioService(CatalogoDbContext context)
    {
        _context = context;
        _passwordHasher = new PasswordHasher<Usuario>();
    }

    public async Task<(IEnumerable<UsuarioListadoDto> Items, int TotalRegistros)> ListarAsync(UsuarioFiltroDto filtro)
    {
        filtro.Pagina = filtro.Pagina <= 0 ? 1 : filtro.Pagina;
        filtro.RegistrosPorPagina = filtro.RegistrosPorPagina <= 0 ? 10 : filtro.RegistrosPorPagina;

        var query = _context.Usuarios
            .AsNoTracking()
            .Where(u => u.DeletedAt == null)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filtro.Cedula))
        {
            var cedula = filtro.Cedula.Trim();
            query = query.Where(u => u.UsuCedula.Contains(cedula));
        }

        if (!string.IsNullOrWhiteSpace(filtro.Nombre))
        {
            var nombre = filtro.Nombre.Trim();
            query = query.Where(u =>
                (u.UsuNombre + " " + u.UsuApellido).Contains(nombre) ||
                u.UsuNombre.Contains(nombre) ||
                u.UsuApellido.Contains(nombre));
        }

        if (!string.IsNullOrWhiteSpace(filtro.Rol))
        {
            var rol = filtro.Rol.Trim().ToUpperInvariant();
            query = query.Where(u => u.UsuRol == rol);
        }

        if (filtro.UsuEstado.HasValue)
        {
            query = query.Where(u => u.UsuEstado == filtro.UsuEstado.Value);
        }

        var totalRegistros = await query.CountAsync();

        var items = await query
            .OrderByDescending(u => u.UsuId)
            .Skip((filtro.Pagina - 1) * filtro.RegistrosPorPagina)
            .Take(filtro.RegistrosPorPagina)
            .Select(u => new UsuarioListadoDto
            {
                UsuId = u.UsuId,
                UsuCedula = u.UsuCedula,
                UsuNombre = u.UsuNombre,
                UsuApellido = u.UsuApellido,
                UsuNombreCompleto = u.UsuNombre + " " + u.UsuApellido,
                UsuRol = u.UsuRol,
                UsuEstado = u.UsuEstado,
                CreatedAt = u.CreatedAt,
                UpdatedAt = u.UpdatedAt
            })
            .ToListAsync();

        return (items, totalRegistros);
    }

    public async Task<UsuarioListadoDto?> ObtenerPorIdAsync(int id)
    {
        var usuario = await _context.Usuarios
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.UsuId == id && u.DeletedAt == null);

        if (usuario == null)
            return null;

        return MapearUsuario(usuario);
    }

    public async Task<UsuarioListadoDto> CrearAsync(UsuarioCrearDto dto, int? createdBy = null)
    {
        var cedula = dto.UsuCedula.Trim();
        var rol = NormalizarYValidarRol(dto.UsuRol);

        var existeCedula = await _context.Usuarios
            .AnyAsync(u => u.UsuCedula == cedula && u.DeletedAt == null);

        if (existeCedula)
            throw new Exception("Ya existe un usuario con esa cédula.");

        var usuario = new Usuario
        {
            UsuCedula = cedula,
            UsuNombre = dto.UsuNombre.Trim(),
            UsuApellido = dto.UsuApellido.Trim(),
            UsuRol = rol,
            UsuEstado = dto.UsuEstado,
            CreatedAt = DateTime.Now,
            CreatedBy = createdBy
        };

        usuario.UsuPassword = _passwordHasher.HashPassword(usuario, dto.Password);

        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();

        return MapearUsuario(usuario);
    }

    public async Task<bool> EditarAsync(int id, UsuarioEditarDto dto, int? updatedBy = null)
    {
        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.UsuId == id && u.DeletedAt == null);

        if (usuario == null)
            return false;

        var cedula = dto.UsuCedula.Trim();
        var rol = NormalizarYValidarRol(dto.UsuRol);

        var existeCedula = await _context.Usuarios
            .AnyAsync(u => u.UsuId != id && u.UsuCedula == cedula && u.DeletedAt == null);

        if (existeCedula)
            throw new Exception("Ya existe otro usuario con esa cédula.");

        usuario.UsuCedula = cedula;
        usuario.UsuNombre = dto.UsuNombre.Trim();
        usuario.UsuApellido = dto.UsuApellido.Trim();
        usuario.UsuRol = rol;
        usuario.UsuEstado = dto.UsuEstado;
        usuario.UpdatedAt = DateTime.Now;
        usuario.UpdatedBy = updatedBy;

        if (!string.IsNullOrWhiteSpace(dto.Password))
        {
            usuario.UsuPassword = _passwordHasher.HashPassword(usuario, dto.Password);
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> EliminarAsync(int id, int? deletedBy = null)
    {
        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.UsuId == id && u.DeletedAt == null);

        if (usuario == null)
            return false;

        usuario.DeletedAt = DateTime.Now;
        usuario.DeletedBy = deletedBy;
        usuario.UpdatedAt = DateTime.Now;
        usuario.UpdatedBy = deletedBy;
        usuario.UsuEstado = false;

        await _context.SaveChangesAsync();
        return true;
    }

    private static string NormalizarYValidarRol(string rol)
    {
        var rolNormalizado = rol.Trim().ToUpperInvariant();

        var rolesPermitidos = new[] { "ADMIN", "OPERADOR", "VENDEDOR" };

        if (!rolesPermitidos.Contains(rolNormalizado))
            throw new Exception("El rol no es válido. Use ADMIN, OPERADOR o VENDEDOR.");

        return rolNormalizado;
    }

    private static UsuarioListadoDto MapearUsuario(Usuario usuario)
    {
        return new UsuarioListadoDto
        {
            UsuId = usuario.UsuId,
            UsuCedula = usuario.UsuCedula,
            UsuNombre = usuario.UsuNombre,
            UsuApellido = usuario.UsuApellido,
            UsuNombreCompleto = usuario.UsuNombre + " " + usuario.UsuApellido,
            UsuRol = usuario.UsuRol,
            UsuEstado = usuario.UsuEstado,
            CreatedAt = usuario.CreatedAt,
            UpdatedAt = usuario.UpdatedAt
        };
    }
}