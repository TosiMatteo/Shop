import {Component, Input} from '@angular/core';
import {CommonModule, CurrencyPipe} from '@angular/common';
import {MatCardModule} from '@angular/material/card';
import {MatChipsModule} from '@angular/material/chips';
import {MatIconModule} from '@angular/material/icon';
import {Order} from '../../../core/models/order';
import {MatButtonModule} from '@angular/material/button';
import {MatDividerModule} from '@angular/material/divider';

@Component({
  selector: 'app-order-card',
  imports: [CommonModule, CurrencyPipe, MatCardModule, MatChipsModule, MatIconModule, MatButtonModule, MatDividerModule],
  templateUrl: './order-card.html',
  styleUrl: './order-card.scss',
})
export class OrderCard {
  @Input({ required: true }) order!: Order;

  // Controls expand/collapse of order details section.
  protected expanded = false;

  protected toggleExpand(): void {
    this.expanded = !this.expanded;
  }

  protected readonly statusColor: Record<Order['status'], string> = {
    processing: 'accent',
    completed:  'primary',
    cancelled:  'warn',
  };

  // User-facing labels for backend status values.
  protected readonly statusLabel: Record<Order['status'], string> = {
    processing: 'In elaborazione',
    completed:  'Completato',
    cancelled:  'Annullato',
  };
}
