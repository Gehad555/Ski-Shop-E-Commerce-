import { Component, inject, input } from '@angular/core';
import { Item } from '../../../shared/models/cart';
import { RouterLink } from '@angular/router';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { CurrencyPipe } from '@angular/common';
import CartService from '../../../core/services/cart.service';

@Component({
  imports: [RouterLink, MatButton, MatIcon, MatIconButton, CurrencyPipe],
  selector: 'app-cart-item',
  styleUrl: './cart-item.component.scss',
  templateUrl: './cart-item.component.html',
})
export class CartItemComponent {
  item = input.required<Item>();
  protected cartService = inject(CartService);
}

export { CartItemComponent as CartItem };
