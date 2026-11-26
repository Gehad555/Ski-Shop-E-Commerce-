using System;

namespace SkiShop.Core.Extensions;

public static class Money
{
    public static long ToCents(decimal amount)
    {
        return (long)(amount * 100);
    }

    public static decimal FromCents(long cents)
    {
        return cents / 100m;
    }

    public static long PercentOfCents(long amount, decimal percent)
    {
        return (long)Math.Floor(amount * (percent / 100m));
    }
}
