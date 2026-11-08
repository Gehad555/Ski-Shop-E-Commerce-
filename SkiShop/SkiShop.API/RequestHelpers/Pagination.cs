namespace SkiShop.API.RequestHelpers
{
    public class Pagination<T>(int Pageindex, int PageSize, int Count, IReadOnlyList<T> Data)
    {
        public int PageIndex { get; set; } = Pageindex;
        public int PageSize { get; set; } = PageSize;
        public int Count { get; set; } = Count;
        public IReadOnlyList<T> Data { get; set; } = Data;
    }
}
