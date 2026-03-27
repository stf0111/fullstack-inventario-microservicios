using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microservicio.Catalogo.Api.Data;
using Microservicio.Catalogo.Api.DTOs.Auth;
using Microservicio.Catalogo.Api.Interfaces;
using Microservicio.Catalogo.Api.Models;

namespace Microservicio.Catalogo.Api.Services;

public class AuthService : IAuthService
{
    private readonly CatalogoDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly PasswordHasher<Usuario> _passwordHasher;

    public AuthService(CatalogoDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
        _passwordHasher = new PasswordHasher<Usuario>();
    }

    public async Task<LoginResponseDto?> LoginAsync(LoginRequestDto dto)
    {
        var cedula = dto.UsuCedula.Trim();

        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u =>
                u.UsuCedula == cedula &&
                u.UsuEstado &&
                u.DeletedAt == null);

        if (usuario == null)
            return null;

        if (string.IsNullOrWhiteSpace(usuario.UsuPassword))
            return null;

        var resultadoPassword = _passwordHasher.VerifyHashedPassword(
            usuario,
            usuario.UsuPassword,
            dto.Password
        );

        if (resultadoPassword == PasswordVerificationResult.Failed)
            return null;

        var token = GenerarToken(usuario, out DateTime expiracion);

        return new LoginResponseDto
        {
            Token = token,
            Expiracion = expiracion,
            Usuario = MapearUsuario(usuario)
        };
    }

    public async Task<UsuarioAutenticadoDto?> ObtenerPerfilAsync(int usuId)
    {
        var usuario = await _context.Usuarios
            .AsNoTracking()
            .FirstOrDefaultAsync(u =>
                u.UsuId == usuId &&
                u.UsuEstado &&
                u.DeletedAt == null);

        if (usuario == null)
            return null;

        return MapearUsuario(usuario);
    }

    private string GenerarToken(Usuario usuario, out DateTime expiracion)
    {
        var jwtKey = _configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("No existe Jwt:Key en appsettings.json.");

        var issuer = _configuration["Jwt:Issuer"]
            ?? throw new InvalidOperationException("No existe Jwt:Issuer en appsettings.json.");

        var audience = _configuration["Jwt:Audience"]
            ?? throw new InvalidOperationException("No existe Jwt:Audience en appsettings.json.");

        var expiresInMinutes = int.TryParse(_configuration["Jwt:ExpiresInMinutes"], out int minutos)
            ? minutos
            : 120;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        expiracion = DateTime.UtcNow.AddMinutes(expiresInMinutes);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, usuario.UsuId.ToString()),
            new Claim(ClaimTypes.Name, $"{usuario.UsuNombre} {usuario.UsuApellido}"),
            new Claim(ClaimTypes.Role, usuario.UsuRol),
            new Claim("cedula", usuario.UsuCedula)
        };

        var tokenDescriptor = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expiracion,
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(tokenDescriptor);
    }

    private static UsuarioAutenticadoDto MapearUsuario(Usuario usuario)
    {
        return new UsuarioAutenticadoDto
        {
            UsuId = usuario.UsuId,
            UsuCedula = usuario.UsuCedula,
            UsuNombreCompleto = $"{usuario.UsuNombre} {usuario.UsuApellido}",
            UsuRol = usuario.UsuRol,
            UsuEstado = usuario.UsuEstado
        };
    }
}