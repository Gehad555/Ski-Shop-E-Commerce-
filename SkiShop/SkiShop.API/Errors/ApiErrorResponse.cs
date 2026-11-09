namespace SkiShop.API.Errors
{
    public class ApiErrorResponse(int statusCode, string message, string? details)
    {
        public int statusCode { set; get; } = statusCode;
        public string message { set; get; } = message;
        public string? details { set; get; } = details;
    }
}
