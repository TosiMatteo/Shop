import { Routes } from '@angular/router';
import {CheckoutPage} from './features/checkout/checkout-page/checkout-page';
import {authGuard} from './core/guard/auth-guard';
import {LoginPage} from './features/auth/login-page/login-page';

// @ts-ignore
export const routes: Routes = [
  {path: '', redirectTo: 'products', pathMatch: 'full'},

  {path: 'products', loadComponent:
      ()=> import('./features/products/product-page/product-page')
      .then(m => m.ProductPage)},

  {path: 'checkout', component:CheckoutPage, canActivate: [authGuard]},
  {path: 'login', component:LoginPage },
  {path: 'logout', redirectTo: 'products', pathMatch: 'full'},
  {path: 'register', component:LoginPage},

  {path: '**', redirectTo: 'products'}
];

