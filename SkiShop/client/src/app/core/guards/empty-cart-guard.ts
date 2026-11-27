import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import CartService from '../services/cart.service';
import { SnackbarService } from '../services/snackbar.service';

export const emptyCartGuard: CanActivateFn = (route, state) => {
  const cartService = inject(CartService);
  const router = inject(Router);
  const snackbar = inject(SnackbarService);

  if (cartService.itemCount() && cartService.itemCount()! > 0) {
    return true;
  }

  snackbar.error('Your cart is empty');
  return router.createUrlTree(['/cart']);
};
