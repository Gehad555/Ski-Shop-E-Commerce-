import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { ShopComponent } from './features/shop/shop.component';
import { ProductDetailsComponent } from './features/product-details/product-details.component';
import { TestErrorComponent } from './features/test-error/test-error.component';
import { ServerErrorComponent } from './shared/components/server-error/server-error.component';
import { NotFoundComponent } from './shared/components/not-found/not-found.component';
import { CartComponent } from './features/cart/cart.component';
import { Checkout } from './features/checkout/checkout.component';
import { LoginComponent } from './features/account/login/login.component';
import { RegisterComponent } from './features/account/register/register.component';
import { authGuard } from './core/guards/auth-guard';
import { emptyCartGuard } from './core/guards/empty-cart-guard';
import { paymentIntentResolver } from './core/resolvers/payment-intent-resolver';
import { Orders } from './features/orders/orders/orders.component';
import { OrderDetailed } from './features/orders/order-detailed/order-detailed.component';


export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'shop', component: ShopComponent },
  { path: 'shop/:id', component: ProductDetailsComponent },
  { path: 'test-error', component: TestErrorComponent },
  { path: 'cart', component: CartComponent },
  {path: 'checkout', component: Checkout, 
        canActivate: [authGuard, emptyCartGuard],
        resolve: {paymentIntent: paymentIntentResolver}
    },
     {path: 'orders', component: Orders, canActivate: [authGuard]},
    {path: 'orders/:id', component: OrderDetailed, canActivate: [authGuard]},
  { path: 'account/login', component: LoginComponent },
  { path: 'account/register', component: RegisterComponent },
  { path: 'server-error', component: ServerErrorComponent },
  { path: 'not-found', component: NotFoundComponent },
  { path: '**', redirectTo: 'not-found', pathMatch: 'full' }
];
