using GlowBook.Application.Services;
using GlowBook.Core.Entities;
using GlowBook.Core.Interfaces;
using GlowBook.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ============================================================
// CORS
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
                "https://glowbook-frontend.onrender.com",
                "null"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// ============================================================
// JWT AUTHENTICATION
// ============================================================
var jwtKey    = builder.Configuration["Jwt:Key"]    ?? "GlowBookSecretKey2026!SuperSecret";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "GlowBookAPI";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = jwtIssuer,
            ValidAudience            = jwtIssuer,
            IssuerSigningKey         = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

// ============================================================
// CSV PATHS
// ============================================================
string basePath = Path.GetFullPath(Path.Combine(
    Directory.GetCurrentDirectory(),
    "..", "GlowBook.Infrastructure", "Data", "Database"
));
Directory.CreateDirectory(basePath);

string userPath        = Path.Combine(basePath, "users.csv");
string servicePath     = Path.Combine(basePath, "services.csv");
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

// ============================================================
// CONTROLLERS + SWAGGER me JWT support
// ============================================================
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "GlowBook API", Version = "v1" });

    // Shto JWT support në Swagger UI
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name         = "Authorization",
        Type         = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme       = "Bearer",
        BearerFormat = "JWT",
        In           = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description  = "Shkruaj tokenin JWT këtu. Shembull: Bearer {token}"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id   = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// ============================================================
// MIDDLEWARE PIPELINE
// ============================================================
var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "GlowBook API v1");
    c.RoutePrefix = "swagger";
});

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";
Console.WriteLine($"GlowBook API duke filluar ne port: {port}");
app.Run($"http://0.0.0.0:{port}");