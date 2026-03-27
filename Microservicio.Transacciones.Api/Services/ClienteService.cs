using Microsoft.EntityFrameworkCore;
using Microservicio.Transacciones.Api.Data;
using Microservicio.Transacciones.Api.DTOs.Cliente;
using Microservicio.Transacciones.Api.Interfaces;
using Microservicio.Transacciones.Api.Models;

namespace Microservicio.Transacciones.Api.Services;

public class ClienteService : IClienteService
{
    private readonly TransaccionesDbContext _context;

    public ClienteService(TransaccionesDbContext context)
    {
        _context = context;
    }

    public async Task<(IEnumerable<ClienteListadoDto> Items, int TotalRegistros)> ListarAsync(ClienteFiltroDto filtro)
    {
        filtro.Pagina = filtro.Pagina <= 0 ? 1 : filtro.Pagina;
        filtro.RegistrosPorPagina = filtro.RegistrosPorPagina <= 0 ? 10 : filtro.RegistrosPorPagina;

        var query = _context.Clientes
            .AsNoTracking()
            .Where(c => c.DeletedAt == null)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filtro.Cedula))
        {
            var cedula = filtro.Cedula.Trim();
            query = query.Where(c => c.CliCedula != null && c.CliCedula.Contains(cedula));
        }

        if (!string.IsNullOrWhiteSpace(filtro.Nombre))
        {
            var nombre = filtro.Nombre.Trim();
            query = query.Where(c =>
                (c.CliNombre + " " + c.CliApellido).Contains(nombre) ||
                c.CliNombre.Contains(nombre) ||
                c.CliApellido.Contains(nombre));
        }

        if (!string.IsNullOrWhiteSpace(filtro.Correo))
        {
            var correo = filtro.Correo.Trim();
            query = query.Where(c => c.CliCorreo != null && c.CliCorreo.Contains(correo));
        }

        var totalRegistros = await query.CountAsync();

        var items = await query
            .OrderByDescending(c => c.CliId)
            .Skip((filtro.Pagina - 1) * filtro.RegistrosPorPagina)
            .Take(filtro.RegistrosPorPagina)
            .Select(c => new ClienteListadoDto
            {
                CliId = c.CliId,
                CliCedula = c.CliCedula,
                CliNombre = c.CliNombre,
                CliApellido = c.CliApellido,
                CliNombreCompleto = c.CliNombre + " " + c.CliApellido,
                CliDireccion = c.CliDireccion,
                CliCorreo = c.CliCorreo,
                CliTelefono = c.CliTelefono,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            })
            .ToListAsync();

        return (items, totalRegistros);
    }

    public async Task<ClienteListadoDto?> ObtenerPorIdAsync(int id)
    {
        var cliente = await _context.Clientes
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.CliId == id && c.DeletedAt == null);

        if (cliente == null)
            return null;

        return MapearCliente(cliente);
    }

    public async Task<ClienteListadoDto> CrearAsync(ClienteCrearDto dto, int? createdBy = null)
    {
        var cedula = string.IsNullOrWhiteSpace(dto.CliCedula) ? null : dto.CliCedula.Trim();

        if (!string.IsNullOrWhiteSpace(cedula))
        {
            var existeCedula = await _context.Clientes
                .AnyAsync(c => c.CliCedula == cedula && c.DeletedAt == null);

            if (existeCedula)
                throw new Exception("Ya existe un cliente con esa cédula.");
        }

        var cliente = new Cliente
        {
            CliCedula = cedula,
            CliNombre = dto.CliNombre.Trim(),
            CliApellido = dto.CliApellido.Trim(),
            CliDireccion = string.IsNullOrWhiteSpace(dto.CliDireccion) ? null : dto.CliDireccion.Trim(),
            CliCorreo = string.IsNullOrWhiteSpace(dto.CliCorreo) ? null : dto.CliCorreo.Trim(),
            CliTelefono = string.IsNullOrWhiteSpace(dto.CliTelefono) ? null : dto.CliTelefono.Trim(),
            CreatedAt = DateTime.Now,
            CreatedBy = createdBy
        };

        _context.Clientes.Add(cliente);
        await _context.SaveChangesAsync();

        return MapearCliente(cliente);
    }

    public async Task<bool> EditarAsync(int id, ClienteEditarDto dto, int? updatedBy = null)
    {
        var cliente = await _context.Clientes
            .FirstOrDefaultAsync(c => c.CliId == id && c.DeletedAt == null);

        if (cliente == null)
            return false;

        var cedula = string.IsNullOrWhiteSpace(dto.CliCedula) ? null : dto.CliCedula.Trim();

        if (!string.IsNullOrWhiteSpace(cedula))
        {
            var existeCedula = await _context.Clientes
                .AnyAsync(c => c.CliId != id && c.CliCedula == cedula && c.DeletedAt == null);

            if (existeCedula)
                throw new Exception("Ya existe otro cliente con esa cédula.");
        }

        cliente.CliCedula = cedula;
        cliente.CliNombre = dto.CliNombre.Trim();
        cliente.CliApellido = dto.CliApellido.Trim();
        cliente.CliDireccion = string.IsNullOrWhiteSpace(dto.CliDireccion) ? null : dto.CliDireccion.Trim();
        cliente.CliCorreo = string.IsNullOrWhiteSpace(dto.CliCorreo) ? null : dto.CliCorreo.Trim();
        cliente.CliTelefono = string.IsNullOrWhiteSpace(dto.CliTelefono) ? null : dto.CliTelefono.Trim();
        cliente.UpdatedAt = DateTime.Now;
        cliente.UpdatedBy = updatedBy;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> EliminarAsync(int id, int? deletedBy = null)
    {
        var cliente = await _context.Clientes
            .FirstOrDefaultAsync(c => c.CliId == id && c.DeletedAt == null);

        if (cliente == null)
            return false;

        var tieneFacturas = await _context.Facturas
            .AnyAsync(f => f.CliId == id && f.DeletedAt == null);

        if (tieneFacturas)
            throw new Exception("No se puede eliminar el cliente porque tiene facturas asociadas.");

        cliente.DeletedAt = DateTime.Now;
        cliente.DeletedBy = deletedBy;
        cliente.UpdatedAt = DateTime.Now;
        cliente.UpdatedBy = deletedBy;

        await _context.SaveChangesAsync();
        return true;
    }

    private static ClienteListadoDto MapearCliente(Cliente cliente)
    {
        return new ClienteListadoDto
        {
            CliId = cliente.CliId,
            CliCedula = cliente.CliCedula,
            CliNombre = cliente.CliNombre,
            CliApellido = cliente.CliApellido,
            CliNombreCompleto = cliente.CliNombre + " " + cliente.CliApellido,
            CliDireccion = cliente.CliDireccion,
            CliCorreo = cliente.CliCorreo,
            CliTelefono = cliente.CliTelefono,
            CreatedAt = cliente.CreatedAt,
            UpdatedAt = cliente.UpdatedAt
        };
    }
}