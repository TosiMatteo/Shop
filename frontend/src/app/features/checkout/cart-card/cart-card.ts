import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { CartItem } from '../../../core/models/cart-item';
import { CartService } from '../../../core/services/cart/cart-service';

@Component({
  selector: 'app-cart-card',
  standalone: true,
  imports: [
    AsyncPipe,
    CurrencyPipe,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
  ],
  templateUrl: './cart-card.html',
  styleUrl: './cart-card.scss',
})
export class CartCardComponent {
  /**
   * Se true, nasconde i controlli di modifica (quantità e rimozione).
   * Usato nella checkout page per mostrare un riepilogo non modificabile.
   */
  @Input() readonly = false;

  private cartService = inject(CartService);
  readonly cart$ = this.cartService.cart$;

  increment(item: CartItem): void {
    this.cartService.updateItem(item.id, item.quantity + 1);
  }

  decrement(item: CartItem): void {
    this.cartService.updateItem(item.id, item.quantity - 1);
  }

  remove(item: CartItem): void {
    this.cartService.removeItem(item.id);
  }
}
