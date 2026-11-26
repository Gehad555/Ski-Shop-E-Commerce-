import { CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardActions, MatCardContent } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { Product } from '../../../shared/models/product';
import { RouterLink } from '@angular/router';
import CartService from '../../../core/services/cart.service';


@Component({
  selector: 'app-product-item',
  imports: [
    MatCard,
    MatCardContent,
    MatCardActions,
    MatIcon,
    CurrencyPipe,
    MatButton,
    RouterLink,
    NgOptimizedImage
],
  templateUrl: './product-item.component.html',
  styleUrl: './product-item.component.scss',
})
export class ProductItemComponent {

 @Input() product?: Product;
   protected cartService = inject(CartService);

}
