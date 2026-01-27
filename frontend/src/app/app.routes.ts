import { Routes } from '@angular/router';
import {CheckoutPage} from './features/checkout/checkout-page/checkout-page';
import {checkoutGuard} from './core/guard/checkout-guard';

// @ts-ignore
export const routes: Routes = [
  {path: '', redirectTo: 'products', pathMatch: 'full'},

  {path: 'products', loadComponent:
      ()=> import('./features/products/product-page/product-page')
      .then(m => m.ProductPage)},

  {path: 'checkout', component:CheckoutPage, canActivate: [checkoutGuard]}
];

