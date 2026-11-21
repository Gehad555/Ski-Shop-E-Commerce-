import { Component, inject, signal } from '@angular/core';

import { CurrencyPipe, Location } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { Router, RouterLink } from '@angular/router';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import CartService from '../../../core/services/cart.service';

@Component({
  imports: [CurrencyPipe, MatButton, RouterLink, MatFormField, MatLabel, MatInput],
  selector: 'app-order-summary',
  styleUrl: './order-summary.component.scss',
  templateUrl: './order-summary.component.html',
})
export class OrderSummaryComponent {
  protected cartService = inject(CartService);
  protected location = inject(Location);
  private router = inject(Router);
  loading = signal(false);

  async onCheckout() {
    this.loading.set(true);
    await this.router.navigateByUrl('/checkout');
    this.loading.set(false);
  }
}

export { OrderSummaryComponent as OrderSummary };
