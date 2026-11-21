import { afterRenderEffect, Component, computed, inject, signal } from '@angular/core';
import { MatStepper, MatStep, MatStepperNext, MatStepperPrevious } from '@angular/material/stepper';
import { StripeService } from '../../core/services/stripe.service';
import { MatButton } from '@angular/material/button';
import { Router, RouterLink } from '@angular/router';
import { MatCheckbox } from '@angular/material/checkbox';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { AccountService } from '../../core/services/account.service';
import { firstValueFrom } from 'rxjs';
import { CurrencyPipe } from '@angular/common';
import { SnackbarService } from '../../core/services/snackbar.service';
import { Address, StripeError } from '@stripe/stripe-js';
import { CheckoutDelivery } from './checkout-delivery/checkout-delivery.component';
import { CheckoutReview } from './checkout-review/checkout-review.component';
import CartService from '../../core/services/cart.service';
import { OrderSummary } from '../orders/order-summary/order-summary.component';

enum CheckoutStep {
  Address,
  Delivery,
  Payment,
  Review
}

@Component({
  imports: [
    OrderSummary,
    MatStepper,
    MatStep,
    MatButton,
    MatStepperNext,
    RouterLink,
    MatCheckbox,
    CheckoutDelivery,
    MatStepperPrevious,
    CheckoutReview,
    CurrencyPipe
  ],
  selector: 'app-checkout',
  styleUrl: './checkout.component.scss',
  templateUrl: './checkout.component.html',
})
export class CheckoutComponent {
  private stripeService = inject(StripeService);
  protected saveAddress = signal(false);
  private accountService = inject(AccountService);
  protected cartService = inject(CartService);
  protected addressComplete = signal(false);
  protected deliveryComplete = signal(false);
  protected paymentComplete = signal(false);
  private snackbar = inject(SnackbarService);
  protected processing = signal(false);
  protected loading = signal(false);
  private router = inject(Router);

  protected checkoutComplete = computed(() => {
    return this.addressComplete() && this.deliveryComplete() && this.paymentComplete()
  })

  private addressElementMounted = false;
  private paymentElementMounted = false;

  constructor() {
    afterRenderEffect(() => {
      this.mountAddressElement();
      this.mountPaymentElement();
    });
  }

  private mountAddressElement() {
    if (!this.addressElementMounted) {
      const addressElement = this.stripeService.addressElementResource.value();
      const addressEl = document.getElementById('address-element');
      if (addressElement && addressEl) {
        addressElement.mount('#address-element');
        addressElement.on('change', event => this.addressComplete.set(event.complete));
        this.addressElementMounted = true;
      }
    }
  }

  private mountPaymentElement() {
    if (!this.paymentElementMounted) {
      const paymentElement = this.stripeService.paymentElementResource.value();
      const paymentEl = document.getElementById('payment-element');
      if (paymentElement && paymentEl) {
        paymentElement.mount('#payment-element');
        paymentElement.on('change', event => this.paymentComplete.set(event.complete));
        this.paymentElementMounted = true;
      }
    }
  }

  async onStepChange(event: StepperSelectionEvent) {
    if (event.selectedIndex === CheckoutStep.Delivery) {
      if (this.saveAddress()) {
        const address = await this.getAddressFromStripeAddress();
        address && void firstValueFrom(this.accountService.updateAddress(address))
      }
    }
    if (event.selectedIndex === CheckoutStep.Payment) {
      this.mountPaymentElement();
    }
  }

  async onPaymentNext(stepper: MatStepper) {
    this.loading.set(true);
    try {
      const result = await this.stripeService.createConfirmationToken();
      if (result?.error) {
        this.snackbar.error(result.error.message ?? 'Payment details invalid');
        return;
      }
      stepper.next();
    } catch (error) {
      this.snackbar.error((error as StripeError)?.message ?? (error as Error)?.message ?? 'Problem creating confirmation token');
    } finally {
      this.loading.set(false);
    }
  }

  async onConfirmPayment(stepper: MatStepper) {
    this.processing.set(true);
    try {
      let confirmationToken = this.stripeService.confirmationToken();
      if (!confirmationToken) {
        const tokenResult = await this.stripeService.createConfirmationToken();
        if (tokenResult?.error) throw tokenResult.error;
        confirmationToken = this.stripeService.confirmationToken();
      }

      if (!confirmationToken) {
        throw new Error('Payment confirmation token could not be created');
      }

      const result = await this.stripeService.confirmPayment();
      if (result?.error) throw result.error;
      if (result?.paymentIntent?.status === 'succeeded') {
        this.cartService.deleteCart();
        this.snackbar.success('Payment successful');
        void this.router.navigateByUrl('/');
      } else if (result?.paymentIntent) {
        throw new Error(`Payment status: ${result.paymentIntent.status}`);
      }
    } catch (error) {
      this.snackbar.error((error as StripeError)?.message ?? (error as Error)?.message ?? 'Payment could not be processed');
      stepper.previous();
    } finally {
      this.processing.set(false);
    }
  }

  private async getAddressFromStripeAddress(): Promise<Address | null> {
    const addressElement = this.stripeService.addressElementResource.value();
    const result = await addressElement?.getValue();
    const address = result?.value.address;
    if (address) {
      return {
        line1: address.line1,
        line2: address.line2 ,
        city: address.city,
        state: address.state,
        country: address.country,
        postal_code: address.postal_code 
      }
    } else return null;
  }
}

export { CheckoutComponent as Checkout };
