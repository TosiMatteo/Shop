import {Component, inject} from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { map } from 'rxjs';
import { CartService } from '../core/services/cart/cart-service';

@Component({
  selector: 'app-cart-icon',
  standalone: true,
  imports: [AsyncPipe, RouterLink, MatIconModule, MatButtonModule, MatBadgeModule],
  template: `
    <button
      mat-icon-button
      routerLink="/cart"
      aria-label="Vai al carrello"
    >
      <mat-icon
        [matBadge]="count$ | async"
        [matBadgeHidden]="(count$ | async) === 0"
        matBadgeColor="warn"
        matBadgeSize="medium"
      >
        shopping_cart
      </mat-icon>
    </button>
  `,
})
export class CartIconComponent {
  private cartService = inject(CartService);

  readonly count$ = this.cartService.cart$.pipe(
    map(cart => cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0),
  );
}
