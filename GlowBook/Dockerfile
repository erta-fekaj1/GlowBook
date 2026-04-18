# Përdor SDK 8.0 për build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# 1. Kopjo të gjitha file-at .csproj për të bërë restore efikas
COPY ["GlowBook.API/GlowBook.API.csproj", "GlowBook.API/"]
COPY ["GlowBook.Application/GlowBook.Application.csproj", "GlowBook.Application/"]
COPY ["GlowBook.Core/GlowBook.Core.csproj", "GlowBook.Core/"]
COPY ["GlowBook.Infrastructure/GlowBook.Infrastructure.csproj", "GlowBook.Infrastructure/"]

# 2. Bëj restore të gjitha varësitë
RUN dotnet restore "GlowBook.API/GlowBook.API.csproj"

# 3. Tash kopjo të gjithë kodin tjetër
COPY . .

# 4. Ndërto projektin
WORKDIR "/src/GlowBook.API"
RUN dotnet publish "GlowBook.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# 5. Runtime image (më e lehtë)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Porti që përdor Render
EXPOSE 80
EXPOSE 443

ENTRYPOINT ["dotnet", "GlowBook.API.dll"]