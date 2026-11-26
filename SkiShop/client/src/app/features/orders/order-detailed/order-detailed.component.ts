import { Router, RouterLink } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardActions, MatCardContent, MatCardHeader } from '@angular/material/card';
import { MatChip } from '@angular/material/chips';
import { Component, computed, inject, input } from '@angular/core';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { environment } from '../../../../environments/environment';
import { httpResource } from '@angular/common/http';
import { Order } from '../../../shared/models/order';
import { SplitCamelCasePipe } from '../../../shared/pipes/split-camel-case-pipe';
import { AccountService } from '../../../core/services/account.service';

@Component({
  imports: [
    MatCard,
    MatCardHeader,
    MatChip,
    NgClass,
    MatCardContent,
    CurrencyPipe,
    DatePipe,
    MatCardActions,
    RouterLink,
    MatButton,
    SplitCamelCasePipe
  ],
  selector: 'app-order-detailed',
  styleUrl: './order-detailed.component.scss',
  templateUrl: './order-detailed.component.html',
})
export class OrderDetailed {
  private baseUrl = environment.apiUrl.endsWith('/') ? environment.apiUrl : `${environment.apiUrl}/`;
  private accountService = inject(AccountService);
  private router = inject(Router);
  protected buttonText = computed(() => this.accountService.isAdmin() ? 'Return to admin' : 'Return to orders');
  id = input<string>();

  onReturnClick() {
    void this.router.navigateByUrl(this.accountService.isAdmin() ? '/admin' : '/orders');
  }

  orderResource = httpResource<Order>(() => {
    const id = this.id();
    if (!id) return undefined;
    return this.accountService.isAdmin()
      ? `${this.baseUrl}admin/orders/${id}`
      : `${this.baseUrl}orders/${id}`;
  });
}

export { OrderDetailed as OrderDetailedComponent };
