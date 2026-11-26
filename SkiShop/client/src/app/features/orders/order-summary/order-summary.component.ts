import { Component, effect, inject, signal } from '@angular/core';

import { CurrencyPipe, Location } from '@angular/common';
import { MatButton, MatIconButton } from '@angular/material/button';
import { Router, RouterLink } from '@angular/router';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import CartService from '../../../core/services/cart.service';
import { StripeService } from '../../../core/services/stripe.service';

@Component({
  imports: [
    CurrencyPipe,
    MatButton,
    MatIconButton,
    RouterLink,
    MatFormField,
    MatLabel,
    MatInput,
    MatIcon,
    ReactiveFormsModule
  ],
  selector: 'app-order-summary',
  styleUrl: './order-summary.component.scss',
  templateUrl: './order-summary.component.html',
})
export class OrderSummaryComponent {
  protected cartService = inject(CartService);
  protected location = inject(Location);
  private router = inject(Router);
  private stripeService = inject(StripeService);
  loading = signal(false);
  couponPending = signal(false);

  protected codeControl = new FormControl('', { nonNullable: true });

  constructor() {
    effect(() => {
      const coupon = this.cartService.cartResource.value()?.coupon;
      if (coupon) {
        this.codeControl.disable();
      } else {
        this.codeControl.enable();
      }
    });
  }

  async onCheckout() {
    this.loading.set(true);
    await this.router.navigateByUrl('/checkout');
    this.loading.set(false);
  }

  async applyCouponCode() {
    const code = this.codeControl.value.trim();
    if (!code) return;
    this.couponPending.set(true);
    try {
      const coupon = await this.cartService.validateCoupon(code);
      const cart = this.cartService.cartResource.value();
      if (cart) {
        cart.coupon = coupon;
        await this.cartService.setCart(cart);
        this.codeControl.setValue('');
        if (this.location.path() === '/checkout') {
          await this.stripeService.createOrUpdatePaymentIntent();
        }
      }
    } catch (error) {
      this.codeControl.setValue('');
    } finally {
      this.couponPending.set(false);
    }
  }

  async removeCouponCode() {
    const cart = this.cartService.cartResource.value();
    if (!cart) return;
    if (cart.coupon) cart.coupon = undefined;
    await this.cartService.setCart(cart);
    if (this.location.path() === '/checkout') {
      await this.stripeService.createOrUpdatePaymentIntent();
    }
  }
}

export { OrderSummaryComponent as OrderSummary };
