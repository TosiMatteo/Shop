import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { CartCardComponent } from '../cart-card/cart-card';
import { CartService } from '../../../core/services/cart/cart-service';
import { AuthService } from '../../../core/services/auth/auth-service';
import { map } from 'rxjs';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [AsyncPipe, MatCardModule, MatButtonModule, CartCardComponent],
  templateUrl: './cart-page.html',
  styleUrl: './cart-page.scss',
})
export class CartPageComponent {
  private cartService = inject(CartService);
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly cart$ = this.cartService.cart$;
  /**
   * Disabilita il pulsante checkout se il carrello è vuoto.
   */
  readonly hasItems$ = this.cart$.pipe(map(cart => (cart?.items.length ?? 0) > 0));

  readonly isAuthenticated = this.auth.isAuthenticated();

  proceedToCheckout(): void {
    if (this.isAuthenticated) {
      this.router.navigate(['/checkout']);
    } else {
      // Porta al login mantenendo il redirect verso checkout
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout' } });
    }
  }
}
