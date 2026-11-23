import { RouterLink } from '@angular/router';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardActions, MatCardContent, MatCardHeader } from '@angular/material/card';
import { MatChip } from '@angular/material/chips';
import { Component, input } from '@angular/core';
import { CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { environment } from '../../../../environments/environment';
import { httpResource } from '@angular/common/http';
import { Order } from '../../../shared/models/order';
import { SplitCamelCasePipe } from '../../../shared/pipes/split-camel-case-pipe';

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
  id = input<string>();

  orderResource = httpResource<Order>(() => this.id() 
    ? `${this.baseUrl}orders/${this.id()}` : undefined);
}

export { OrderDetailed as OrderDetailedComponent };
