using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microservicio.Catalogo.Api.DTOs.Auth;
using Microservicio.Catalogo.Api.Interfaces;
using Microsoft.AspNetCore.Authorization;

namespace Microservicio.Catalogo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
    {
        var resultado = await _authService.LoginAsync(dto);

        if (resultado == null)
        {
            return Unauthorized(new
            {
                mensaje = "Credenciales inválidas."
            });
        }

        return Ok(new
        {
            mensaje = "Inicio de sesión correcto.",
            datos = resultado
        });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var usuIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(usuIdClaim, out int usuId))
        {
            return Unauthorized(new
            {
                mensaje = "Token inválido."
            });
        }

        var usuario = await _authService.ObtenerPerfilAsync(usuId);

        if (usuario == null)
        {
            return NotFound(new
            {
                mensaje = "Usuario no encontrado."
            });
        }

        return Ok(new
        {
            mensaje = "Usuario autenticado obtenido correctamente.",
            datos = usuario
        });
    }
}