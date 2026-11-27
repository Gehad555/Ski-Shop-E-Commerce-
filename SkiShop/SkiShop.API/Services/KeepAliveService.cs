namespace SkiShop.API.Services;

public class KeepAliveService(IHttpClientFactory httpClientFactory, ILogger<KeepAliveService> logger)
    : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(10));

        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                var client = httpClientFactory.CreateClient("KeepAlive");
                var response = await client.GetAsync("api/products?pageSize=1", stoppingToken);
                logger.LogInformation("Keep-alive ping: {StatusCode}", response.StatusCode);
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Keep-alive ping failed");
            }
        }
    }
}
