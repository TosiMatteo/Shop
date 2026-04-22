import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Product} from '../../../core/models/product';
import {MatCard, MatCardContent} from '@angular/material/card';
import {CurrencyPipe, DecimalPipe, NgOptimizedImage} from '@angular/common';
import {MatIcon} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';

@Component({
  selector: 'app-admin-product-card',
  imports: [
    MatCard,
    MatCardContent,
    NgOptimizedImage,
    MatIcon,
    CurrencyPipe,
    MatIconButton,
    DecimalPipe
  ],
  templateUrl: './admin-product-card.html',
  styleUrl: './admin-product-card.scss',
})
export class AdminProductCard {
  @Input({ required: true }) product!: Product;
  // Bubble edit action to parent container (admin page).
  @Output() edit = new EventEmitter<Product>();
  // Bubble delete action to parent container (admin page).
  @Output() delete = new EventEmitter<Product>();
}
