namespace SkiShop.Core.Entities;

public class SystemLog
{
    public int Id { get; set; }
    public required string Level { get; set; }
    public required string Source { get; set; }
    public required string Message { get; set; }
    public string? Exception { get; set; }
    public string? StackTrace { get; set; }
    public string? RequestMethod { get; set; }
    public string? RequestPath { get; set; }
    public int? StatusCode { get; set; }
    public long? DurationMs { get; set; }
    public string? UserEmail { get; set; }
    public string? IpAddress { get; set; }
    public string? TraceId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
