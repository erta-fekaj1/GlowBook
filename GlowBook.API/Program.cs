using GlowBook.Application.Services;
using GlowBook.API.Middleware;
using GlowBook.Core.Entities;
using GlowBook.Core.Interfaces;
using GlowBook.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ============================================================
// CORS - Konfigurimi për Frontend-in në Render
// ============================================================
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5500",
                "http://127.0.0.1:5500",
                "http://localhost:3000",
                "https://glowbook-2.onrender.com" // URL e Frontendit tënd
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// ============================================================
// JWT AUTHENTICATION
// ============================================================
var jwtKey = builder.Configuration["Jwt:Key"] ?? "Key_e_perkohshme_per_testim_12345";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "GlowBook";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtIssuer,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

// ============================================================
// CSV PATHS - Konfigurimi për Docker (Render)
// ============================================================
string basePath = Path.Combine(Directory.GetCurrentDirectory(), "Database");
Directory.CreateDirectory(basePath);

string userPath = Path.Combine(basePath, "users.csv");
string servicePath = Path.Combine(basePath, "services.csv");
string appointmentPath = Path.Combine(basePath, "appointments.csv");

// ============================================================
// DEPENDENCY INJECTION
// ============================================================
builder.Services.AddSingleton<IRepository<User>>(new FileRepository<User>(userPath));
builder.Services.AddSingleton<IRepository<Service>>(new FileRepository<Service>(servicePath));
builder.Services.AddSingleton<IRepository<Appointment>>(new FileRepository<Appointment>(appointmentPath));

builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<AppointmentService>();
builder.Services.AddScoped<ServiceService>();
builder.Services.AddScoped<AuthService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// ============================================================
// SWAGGER CONFIGURATION
// ============================================================
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "GlowBook API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Shkruaj tokenin JWT këtu. Shembull: Bearer {token}"
    });
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference { Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// ============================================================
// MIDDLEWARE PIPELINE
// ============================================================

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "GlowBook API v1");
    
    // NDRYSHIMI KRYESOR: Bosh që të hapet direkt në root URL
    c.RoutePrefix = string.Empty; 
});

// Ridrejtim automatik nëse dikush shkruan prapë /swagger
app.Use(async (context, next) =>
{
    if (context.Request.Path == "/swagger")
    {
        context.Response.Redirect("/");
        return;
    }
    await next();
});

app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Render përdor variablën e mjedisit PORT (Render cakton portën 10000 automatikisht)
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
app.Run($"http://0.0.0.0:{port}");