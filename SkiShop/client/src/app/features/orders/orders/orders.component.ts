import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, CurrencyPipe, NgClass } from '@angular/common';
import { MatChip } from '@angular/material/chips';
import { OrderService } from '../../../core/services/order.service';
import { SplitCamelCasePipe } from '../../../shared/pipes/split-camel-case-pipe';

@Component({
  imports: [RouterLink, DatePipe, CurrencyPipe, MatChip, NgClass, SplitCamelCasePipe],
  selector: 'app-orders',
  styleUrl: './orders.component.scss',
  templateUrl: './orders.component.html',
})
export class Orders {
  protected orderService = inject(OrderService);
}

export { Orders as OrdersComponent };
