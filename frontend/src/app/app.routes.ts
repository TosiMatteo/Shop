import { Routes } from '@angular/router';
import {CheckoutPage} from './features/checkout/checkout-page/checkout-page';
import {authGuard} from './core/guard/auth-guard';
import {LoginPage} from './features/auth/login-page/login-page';
import {CartPageComponent} from './features/checkout/cart-page/cart-page';
import {OrderPage} from './features/orders/order-page/order-page';

export const routes: Routes = [
  {path: '', redirectTo: 'products', pathMatch: 'full'},

  {path: 'products', loadComponent:
      ()=> import('./features/products/product-page/product-page')
      .then(m => m.ProductPage)},

  {path: 'cart', component:CartPageComponent},
  {path: 'checkout', component:CheckoutPage, canActivate: [authGuard]},
  {path: 'login', component:LoginPage },
  {path: 'logout', redirectTo: 'products', pathMatch: 'full'},
  {path: 'register', component:LoginPage},
  {path: 'orders', component:OrderPage, canActivate: [authGuard]},
  {
    path: 'admin',
    loadChildren: () =>
      import('./features/admin/admin-routes').then(m => m.ADMIN_ROUTES)
  },

  {path: '**', redirectTo: 'products'}
];
