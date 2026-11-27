import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { authGuard } from './core/guards/auth-guard';
import { emptyCartGuard } from './core/guards/empty-cart-guard';
import { paymentIntentResolver } from './core/resolvers/payment-intent-resolver';
import { adminGuard } from './core/guards/admin-guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'shop',
    loadComponent: () => import('./features/shop/shop.component').then(m => m.ShopComponent)
  },
  {
    path: 'shop/:id',
    loadComponent: () => import('./features/product-details/product-details.component').then(m => m.ProductDetailsComponent)
  },
  {
    path: 'cart',
    loadComponent: () => import('./features/cart/cart.component').then(m => m.CartComponent)
  },
  {
    path: 'checkout',
    loadComponent: () => import('./features/checkout/checkout.component').then(m => m.Checkout),
    canActivate: [authGuard, emptyCartGuard],
    resolve: { paymentIntent: paymentIntentResolver }
  },
  {
    path: 'orders',
    loadComponent: () => import('./features/orders/orders/orders.component').then(m => m.Orders),
    canActivate: [authGuard]
  },
  {
    path: 'orders/:id',
    loadComponent: () => import('./features/orders/order-detailed/order-detailed.component').then(m => m.OrderDetailed),
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin.component').then(m => m.Admin),
    canActivate: [authGuard, adminGuard]
  },
  {
    path: 'account/login',
    loadComponent: () => import('./features/account/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'account/register',
    loadComponent: () => import('./features/account/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'logs',
    loadComponent: () => import('./features/admin/admin.component').then(m => m.Admin),
    canActivate: [authGuard, adminGuard],
    data: { initialTab: 3 }
  },
  {
    path: 'test-error',
    redirectTo: 'logs',
    pathMatch: 'full'
  },
  {
    path: 'server-error',
    loadComponent: () => import('./shared/components/server-error/server-error.component').then(m => m.ServerErrorComponent)
  },
  {
    path: 'not-found',
    loadComponent: () => import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent)
  },
  { path: '**', redirectTo: 'not-found', pathMatch: 'full' }
];
