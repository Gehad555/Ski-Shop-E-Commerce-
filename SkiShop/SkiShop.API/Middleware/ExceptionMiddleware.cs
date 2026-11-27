using System.Diagnostics;
using System.Net;
using System.Security.Claims;
using System.Text.Json;
using SkiShop.API.Errors;
using SkiShop.Core.Entities;
using SkiShop.Core.Interfaces;
using SkiShop.Infrastructure.Data;

namespace SkiShop.API.Middleware;

public class ExceptionMiddleware(
    IHostEnvironment env,
    RequestDelegate next,
    ILogger<ExceptionMiddleware> logger,
    IServiceScopeFactory scopeFactory)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        var isLoginRequest = HttpMethods.IsPost(context.Request.Method) &&
                             context.Request.Path.Equals("/api/login", StringComparison.OrdinalIgnoreCase);
        var loginEmail = isLoginRequest ? await TryExtractEmailAsync(context) : null;

        try
        {
            await next(context);
            stopwatch.Stop();

            await TryLogHttpEventAsync(context, stopwatch.ElapsedMilliseconds, loginEmail);

            if (isLoginRequest)
            {
                await TryAuditLoginAsync(context, loginEmail);
            }
        }
        catch (Exception e)
        {
            stopwatch.Stop();
            logger.LogError(e, "Unhandled exception on {Method} {Path}", context.Request.Method, context.Request.Path);

            await PersistSystemLogAsync(new SystemLog
            {
                Level = "Error",
                Source = nameof(ExceptionMiddleware),
                Message = e.Message,
                Exception = e.GetType().FullName,
                StackTrace = e.StackTrace,
                RequestMethod = context.Request.Method,
                RequestPath = context.Request.Path.Value,
                StatusCode = (int)HttpStatusCode.InternalServerError,
                DurationMs = stopwatch.ElapsedMilliseconds,
                UserEmail = loginEmail ?? ResolveUserEmail(context),
                IpAddress = ResolveIpAddress(context),
                TraceId = context.TraceIdentifier,
                Timestamp = DateTime.UtcNow
            });

            await HandleExceptionAsync(context, e, env);
        }
    }

    private async Task TryLogHttpEventAsync(HttpContext context, long elapsedMs, string? overrideEmail)
    {
        var path = context.Request.Path.Value ?? string.Empty;
        if (!path.StartsWith("/api", StringComparison.OrdinalIgnoreCase)) return;

        // Avoid recursive log noise from reading logs/audit or passive auth-check polling
        if (path.StartsWith("/api/admin/logs", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/api/admin/audit", StringComparison.OrdinalIgnoreCase) ||
            path.Equals("/api/account/user-info", StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        var statusCode = context.Response.StatusCode;
        var method = context.Request.Method;
        var isMutation = HttpMethods.IsPost(method) ||
                         HttpMethods.IsPut(method) ||
                         HttpMethods.IsPatch(method) ||
                         HttpMethods.IsDelete(method);

        string? level = null;
        if (statusCode >= 500) level = "Error";
        else if (statusCode >= 400) level = "Warning";
        else if (isMutation) level = "Information";

        if (level == null) return;

        var message = $"{method} {path} responded {statusCode} in {elapsedMs}ms";
        if (level == "Error") logger.LogError("{Message}", message);
        else if (level == "Warning") logger.LogWarning("{Message}", message);
        else logger.LogInformation("{Message}", message);

        await PersistSystemLogAsync(new SystemLog
        {
            Level = level,
            Source = "HTTP",
            Message = message,
            RequestMethod = method,
            RequestPath = path,
            StatusCode = statusCode,
            DurationMs = elapsedMs,
            UserEmail = overrideEmail ?? ResolveUserEmail(context),
            IpAddress = ResolveIpAddress(context),
            TraceId = context.TraceIdentifier,
            Timestamp = DateTime.UtcNow
        });
    }

    private async Task TryAuditLoginAsync(HttpContext context, string? email)
    {
        var statusCode = context.Response.StatusCode;
        var succeeded = statusCode is >= 200 and < 300;

        await PersistAuditLogAsync(new AuditLog
        {
            Action = succeeded ? "Login" : "LoginFailed",
            EntityName = "Auth",
            UserEmail = email,
            IpAddress = ResolveIpAddress(context),
            Details = succeeded
                ? $"User {email ?? "unknown"} signed in"
                : $"Failed login attempt for {email ?? "unknown"} (HTTP {statusCode})",
            Timestamp = DateTime.UtcNow
        });
    }

    private async Task PersistSystemLogAsync(SystemLog log)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<StoreContext>();
            db.SystemLogs.Add(log);
            await db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to persist SystemLog entry");
        }
    }

    private async Task PersistAuditLogAsync(AuditLog auditLog)
    {
        try
        {
            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<StoreContext>();
            db.AuditLogs.Add(auditLog);
            await db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to persist AuditLog entry");
        }
    }

    private static async Task<string?> TryExtractEmailAsync(HttpContext context)
    {
        try
        {
            context.Request.EnableBuffering();
            using var doc = await JsonDocument.ParseAsync(context.Request.Body);
            if (doc.RootElement.ValueKind == JsonValueKind.Object &&
                doc.RootElement.TryGetProperty("email", out var emailProp) &&
                emailProp.ValueKind == JsonValueKind.String)
            {
                return emailProp.GetString()?.Trim();
            }
        }
        catch
        {
            // Ignore malformed login payloads; normal endpoint validation will handle them
        }
        finally
        {
            if (context.Request.Body.CanSeek)
            {
                context.Request.Body.Position = 0;
            }
        }

        return null;
    }

    private static string? ResolveUserEmail(HttpContext context)
    {
        var currentUser = context.RequestServices.GetService<ICurrentUserService>();
        return currentUser?.UserEmail
            ?? context.User?.FindFirstValue(ClaimTypes.Email)
            ?? context.User?.Identity?.Name;
    }

    private static string? ResolveIpAddress(HttpContext context)
    {
        var forwarded = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(forwarded))
        {
            return forwarded.Split(',')[0].Trim();
        }
        return context.Connection.RemoteIpAddress?.ToString();
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception e, IHostEnvironment env)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

        var response = env.IsDevelopment()
            ? new ApiErrorResponse(context.Response.StatusCode, e.Message, e.StackTrace)
            : new ApiErrorResponse(context.Response.StatusCode, e.Message, "Internal Server error");

        var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

        var json = JsonSerializer.Serialize(response, options);

        return context.Response.WriteAsync(json);
    }
}
