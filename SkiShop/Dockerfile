FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY ["SkiShop.API/SkiShop.API.csproj", "SkiShop.API/"]
COPY ["SkiShop.Infrastructure/SkiShop.Infrastructure.csproj", "SkiShop.Infrastructure/"]
COPY ["SkiShop.Core/SkiShop.Core.csproj", "SkiShop.Core/"]
RUN dotnet restore "SkiShop.API/SkiShop.API.csproj"

COPY SkiShop.API/ SkiShop.API/
COPY SkiShop.Infrastructure/ SkiShop.Infrastructure/
COPY SkiShop.Core/ SkiShop.Core/
RUN dotnet publish "SkiShop.API/SkiShop.API.csproj" -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

ENTRYPOINT ["sh", "-c", "ASPNETCORE_HTTP_PORTS=${PORT:-8080} exec dotnet SkiShop.API.dll"]
