import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { httpResource } from '@angular/common/http';
import { Product } from '../../shared/models/product';
import { CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatDivider } from '@angular/material/divider';
import { form, min, FormField } from '@angular/forms/signals';
import CartService from '../../core/services/cart.service';

@Component({
  selector: 'app-product-details',
  imports: [
    CurrencyPipe,
    MatButton,
    MatIcon,
    MatFormField,
    MatLabel,
    MatInput,
    MatDivider,
    FormField,
    NgOptimizedImage
  ],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.scss',
})
export class ProductDetailsComponent {
  private baseUrl = environment.apiUrl;
  protected cartService = inject(CartService);
  id = input<string>();

  productResource = httpResource<Product>(() =>
    this.id() ? `${this.baseUrl}products/${this.id()}` : undefined
  );

  quantityInCart = computed(() => {
    const product = this.productResource.value();
    if (!product) return 0;
    return (
      this.cartService.cartResource
        .value()
        ?.items.find((i) => i.productId === product.id)?.quantity ?? 0
    );
  });

  quantity = linkedSignal(() => this.quantityInCart() || 1);
  quantityField = form(this.quantity, p => {
    min(p, 0);
  });

  getButtonText() {
    return this.quantityInCart() > 0 ? 'Update cart' : 'Add to cart';
  }

  updateCart() {
    const product = this.productResource.value();
    if (!product) return;
    if (this.quantity() > this.quantityInCart()) {
      this.cartService.addItemToCart(product, this.quantity() - this.quantityInCart());
    } else {
      this.cartService.removeItemFromCart(product.id, this.quantityInCart() - this.quantity());
    }
  }
}

export { ProductDetailsComponent as ProductDetails };
