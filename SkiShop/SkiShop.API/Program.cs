using Core.Interfaces;
using Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SkiShop.API.Middleware;
using SkiShop.Core.Entities;
using SkiShop.Core.Interfaces;
using SkiShop.Infrastructure.Data;
using SkiShop.API.Services;
using SkiShop.Infrastructure.Services;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);


builder.Services.AddDbContext<StoreContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddAuthorization();
builder.Services.AddIdentityApiEndpoints<AppUser>()
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<StoreContext>();

builder.Services.ConfigureApplicationCookie(o =>
{
    o.Cookie.SameSite = SameSiteMode.None;
    o.Cookie.SecurePolicy = CookieSecurePolicy.Always;
});

builder.Services.AddSingleton<IConnectionMultiplexer>(config =>
{
    var connString = builder.Configuration.GetConnectionString("Redis")
        ?? throw new Exception("Cannot get redis connection string");
    var configuration = ParseRedisConnectionString(connString);
    return ConnectionMultiplexer.Connect(configuration);
});

builder.Services.AddScoped<ICartService, CartService>();
builder.Services.AddSingleton<IResponseCacheService, ResponseCacheService>();

builder.Services.AddScoped<IPaymentService, PaymentService>();

builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<ICouponService, CouponService>();



builder.Services.AddScoped<IProductRepository,ProductRepository>();

builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));

builder.Services.AddCors();

// Keep-alive: self-ping every 10 min to prevent SnapDeploy sleep
builder.Services.AddHttpClient("KeepAlive", client =>
{
    client.BaseAddress = new Uri("https://ski-shop-e-commerce-87c0a.containers.snapdeploy.app/");
    client.Timeout = TimeSpan.FromSeconds(30);
});
builder.Services.AddHostedService<KeepAliveService>();

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<ExceptionMiddleware>();

app.UseStaticFiles();

var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];

app.UseCors(x => x
    .AllowAnyHeader()
    .AllowAnyMethod()
    .AllowCredentials()
    .WithOrigins(corsOrigins));


app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.MapGroup("api").MapIdentityApi<AppUser>();

try
{
    using var scope = app.Services.CreateScope();
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<StoreContext>();
    var userManager = services.GetRequiredService<UserManager<AppUser>>();
    await context.Database.MigrateAsync();
    await StoreContextSeed.SeedAsync(context, userManager);
}
catch (Exception ex)
{
    var logger = app.Services.GetRequiredService<ILogger<Program>>();
    logger.LogError(ex, "An error occurred while migrating or seeding the database.");
}

app.Run();

static ConfigurationOptions ParseRedisConnectionString(string connString)
{
    if (!connString.StartsWith("redis://") && !connString.StartsWith("rediss://"))
    {
        return ConfigurationOptions.Parse(connString, true);
    }

    var uri = new Uri(connString);
    var options = new ConfigurationOptions
    {
        EndPoints = { { uri.Host, uri.Port } },
        AbortOnConnectFail = false,
        Ssl = uri.Scheme == "rediss"
    };

    if (!string.IsNullOrEmpty(uri.UserInfo))
    {
        var parts = uri.UserInfo.Split(':', 2);
        if (parts.Length == 2)
        {
            if (!string.IsNullOrEmpty(parts[0])) options.User = parts[0];
            options.Password = parts[1];
        }
        else if (!string.IsNullOrEmpty(parts[0]))
        {
            options.Password = parts[0];
        }
    }

    return options;
}
