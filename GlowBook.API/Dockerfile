FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["GlowBook.API.csproj", "."]
COPY ["../GlowBook.Core/GlowBook.Core.csproj", "../GlowBook.Core/"]
COPY ["../GlowBook.Infrastructure/GlowBook.Infrastructure.csproj", "../GlowBook.Infrastructure/"]
COPY ["../GlowBook.Application/GlowBook.Application.csproj", "../GlowBook.Application/"]
RUN dotnet restore
COPY . .
COPY ../GlowBook.Core ../GlowBook.Core
COPY ../GlowBook.Infrastructure ../GlowBook.Infrastructure
COPY ../GlowBook.Application ../GlowBook.Application
RUN dotnet publish -c Release -o /app/out

FROM base AS final
WORKDIR /app
COPY --from=build /app/out .
ENTRYPOINT ["dotnet", "GlowBook.API.dll"]