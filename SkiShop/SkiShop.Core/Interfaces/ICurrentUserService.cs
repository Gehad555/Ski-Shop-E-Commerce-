namespace SkiShop.Core.Interfaces;

public interface ICurrentUserService
{
    string? UserId { get; }
    string? UserEmail { get; }
    string? IpAddress { get; }
}
