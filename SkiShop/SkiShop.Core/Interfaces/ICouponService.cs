using System;
using SkiShop.Core.Entities;

namespace SkiShop.Core.Interfaces;

public interface ICouponService
{
    Task<AppCoupon?> GetCouponFromPromoCode(string code);
    Task<long> CalculateDiscountFromSubtotal(AppCoupon appCoupon, long subtotal);
}
