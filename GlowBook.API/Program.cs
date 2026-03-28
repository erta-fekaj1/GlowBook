using GlowBook.Application.Services;
using GlowBook.Core.Interfaces;
using GlowBook.Core.Entities;
using GlowBook.Infrastructure.Repositories;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

string basePath = Path.Combine(Directory.GetCurrentDirectory(), "..", "GlowBook.Infrastructure", "Data", "Database");
string userPath = Path.Combine(basePath, "users.csv");

builder.Services.AddSingleton<IRepository<User>>(sp => new FileRepository<User>(userPath));
builder.Services.AddScoped<UserService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");
app.UseAuthorization();
app.MapControllers();

app.Run();