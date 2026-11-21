import { Component, effect, inject, OnInit, output } from '@angular/core';
import { MatRadioGroup, MatRadioButton, MatRadioChange } from '@angular/material/radio';
import { CurrencyPipe } from '@angular/common';
import { CheckoutService } from '../../../core/services/checkout.service';
import CartService from '../../../core/services/cart.service';
import { StripeService } from '../../../core/services/stripe.service';

@Component({
  imports: [MatRadioGroup, MatRadioButton, CurrencyPipe],
  selector: 'app-checkout-delivery',
  styleUrl: './checkout-delivery.component.scss',
  templateUrl: './checkout-delivery.component.html',
})
export class CheckoutDeliveryComponent implements OnInit {
  protected checkoutService = inject(CheckoutService);
  protected cartService = inject(CartService);
  private stripeService = inject(StripeService);
  deliveryComplete = output<boolean>();

  constructor() {
    effect(() => this.deliveryComplete.emit(!!this.cartService.cartResource.value()?.deliveryMethodId));
  }

  ngOnInit(): void {
    this.checkoutService.getDeliveryMethods().subscribe({
      next: methods => {
        if (this.cartService.cartResource.value()?.deliveryMethodId) {
          const method = methods.find(a => a.id === this.cartService.cartResource.value()?.deliveryMethodId);
          if (method) {
            this.cartService.selectedDelivery.set(method);
            this.deliveryComplete.emit(true);
          }
        }
      }
    });
  }

  async updateDeliveryMethod(event: MatRadioChange) {
    let cart = this.cartService.cartResource.value();
    if (!cart) return;
    this.cartService.selectedDelivery.set(event.value);
    cart = {...cart, deliveryMethodId: event.value.id};
    await this.cartService.setCart(cart);
    await this.stripeService.createOrUpdatePaymentIntent();
    this.deliveryComplete.emit(true);
  }
}

export { CheckoutDeliveryComponent as CheckoutDelivery };
