import { Component, inject, Input } from '@angular/core';
import { Product } from '../../../core/models/product';
import { CurrencyPipe, NgOptimizedImage } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CartService } from '../../../core/services/cart/cart-service';
import { MatChip} from '@angular/material/chips';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CurrencyPipe, MatCardModule, MatButtonModule, MatIconModule, NgOptimizedImage, MatChip],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;

  private cartService = inject(CartService);
  protected expanded = false;

  // Add one unit of the displayed product to cart.
  addToCart(): void {
    this.cartService.addItem(this.product);
  }

  toggleExpand(): void {
    this.expanded = !this.expanded;
  }
}
