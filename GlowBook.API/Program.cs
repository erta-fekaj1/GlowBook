using GlowBook.Application.Services;
using GlowBook.Core.Entities;
using GlowBook.Core.Interfaces;
using GlowBook.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5500",
                "http://127.0.0.1:5500",
                "http://localhost:3000",
                "null"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

string basePath = Path.GetFullPath(Path.Combine(
    AppDomain.CurrentDomain.BaseDirectory,
    "..", "..", "..", "..", "GlowBook.Infrastructure", "Data", "Database"
));
Directory.CreateDirectory(basePath);

string userPath        = Path.Combine(basePath, "users.csv");
string servicePath     = Path.Combine(basePath, "services.csv");
string appointmentPath = Path.Combine(basePath, "appointments.csv");

builder.Services.AddSingleton<IRepository<User>>(new FileRepository<User>(userPath));
builder.Services.AddSingleton<IRepository<Service>>(new FileRepository<Service>(servicePath));
builder.Services.AddSingleton<IRepository<Appointment>>(new FileRepository<Appointment>(appointmentPath));

builder.Services.AddScoped<UserService>();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "GlowBook API", Version = "v1" });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "GlowBook API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseCors("AllowFrontend");
app.UseAuthorization();
app.MapControllers();

Console.WriteLine("GlowBook API: http://localhost:5000");
Console.WriteLine("Swagger:      http://localhost:5000/swagger");

var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";
app.Run($"http://0.0.0.0:{port}");
