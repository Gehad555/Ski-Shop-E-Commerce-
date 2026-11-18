import { Component, inject } from '@angular/core';
import { CartItem } from './cart-item/cart-item.component';
import { OrderSummaryComponent } from '../orders/order-summary/order-summary.component';
import CartService from '../../core/services/cart.service';

@Component({
  imports: [CartItem  , OrderSummaryComponent ],
  selector: 'app-cart',
  styleUrl: './cart.component.scss',
  templateUrl: './cart.component.html',
})
export class CartComponent {
  protected cartService = inject(CartService);
}