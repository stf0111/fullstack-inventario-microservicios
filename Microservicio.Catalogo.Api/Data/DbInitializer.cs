using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microservicio.Catalogo.Api.Models;

namespace Microservicio.Catalogo.Api.Data;

public static class DbInitializer
{
    public static async Task SeedUsuarioAdminAsync(CatalogoDbContext context)
    {
        const string cedula = "1753724485";

        var usuarioExistente = await context.Usuarios
            .FirstOrDefaultAsync(u => u.UsuCedula == cedula && u.DeletedAt == null);

        if (usuarioExistente != null)
            return;

        var passwordHasher = new PasswordHasher<Usuario>();

        var nuevoUsuario = new Usuario
        {
            UsuCedula = cedula,
            UsuNombre = "Steven",
            UsuApellido = "Mendoza",
            UsuRol = "ADMIN",
            UsuEstado = true,
            CreatedAt = DateTime.Now
        };

        nuevoUsuario.UsuPassword = passwordHasher.HashPassword(nuevoUsuario, "password");

        context.Usuarios.Add(nuevoUsuario);
        await context.SaveChangesAsync();
    }
}