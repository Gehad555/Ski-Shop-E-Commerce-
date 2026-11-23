import { Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { StripeService } from '../../../core/services/stripe.service';
import CartService from '../../../core/services/cart.service';

@Component({
  imports: [CurrencyPipe],
  selector: 'app-checkout-review',
  styleUrl: './checkout-review.component.scss',
  templateUrl: './checkout-review.component.html',
})
export class CheckoutReview {
  protected cartService = inject(CartService);
  protected stripeService = inject(StripeService);
}
