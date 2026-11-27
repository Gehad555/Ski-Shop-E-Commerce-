using SkiShop.Core.Specifications;

namespace SkiShop.API.DTOs;

public class SystemLogQueryParams : PagingParams
{
    public string? Level { get; set; }
    public string? Source { get; set; }
    public int? StatusCode { get; set; }
    public string? Search { get; set; }
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
}

public class AuditLogQueryParams : PagingParams
{
    public string? Action { get; set; }
    public string? EntityName { get; set; }
    public string? Search { get; set; }
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
}

public class LogStatsDto
{
    public int TotalSystemLogs { get; set; }
    public int ErrorCount { get; set; }
    public int WarningCount { get; set; }
    public int InfoCount { get; set; }
    public int TotalAuditLogs { get; set; }
    public int AuditLast24Hours { get; set; }
    public IReadOnlyList<string> AuditActions { get; set; } = [];
    public IReadOnlyList<string> AuditEntities { get; set; } = [];
    public IReadOnlyList<string> LogLevels { get; set; } = [];
    public IReadOnlyList<string> LogSources { get; set; } = [];
}
