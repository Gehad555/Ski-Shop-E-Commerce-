import { Component, inject } from '@angular/core';
import { CartItem } from './cart-item/cart-item.component';
import { OrderSummaryComponent } from '../orders/order-summary/order-summary.component';
import CartService from '../../core/services/cart.service';
import { EmptyStateComponent } from '../../shared/empty-state/empty-state.component';
import { Router } from '@angular/router';
@Component({
  imports: [CartItem  , OrderSummaryComponent , EmptyStateComponent ],
  selector: 'app-cart',
  styleUrl: './cart.component.scss',
  templateUrl: './cart.component.html',
})
export class CartComponent {
  protected cartService = inject(CartService);
   private router = inject(Router);


    onAction() {
    void this.router.navigateByUrl('/shop');
  }
}