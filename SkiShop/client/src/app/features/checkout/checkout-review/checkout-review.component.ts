import { Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { StripeService } from '../../../core/services/stripe.service';
import CartService from '../../../core/services/cart.service';

@Component({
  selector: 'app-checkout-review',
  imports: [CurrencyPipe],
  templateUrl: './checkout-review.component.html',
  styleUrl: './checkout-review.component.scss',
})
export class CheckoutReviewComponent {
  protected stripeService = inject(StripeService);
  protected cartService = inject(CartService);
}

export { CheckoutReviewComponent as CheckoutReview };
