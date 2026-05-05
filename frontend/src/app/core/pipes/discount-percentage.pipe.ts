import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'discountPercentage', pure: true, standalone: true })
export class DiscountPercentagePipe implements PipeTransform {
  transform(originalPrice: number | string, price: number | string): number {
    const original = Number(originalPrice);
    const current = Number(price);
    if (!original || original <= 0 || current >= original) return 0;
    return Math.round((original - current) / original * 100);
  }
}
