import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Product} from '../../../core/models/product';
import {CurrencyPipe, NgOptimizedImage} from '@angular/common';
import {MatCardModule} from '@angular/material/card';
import {MatButtonModule} from '@angular/material/button';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'app-product-card',
  imports: [
    CurrencyPipe, MatCardModule, MatButtonModule, MatIcon, NgOptimizedImage
  ],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
})
export class ProductCardComponent {
  @Input({required:true}) product!: Product;
  @Output() add = new EventEmitter<Product>();
}
