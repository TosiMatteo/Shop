import {Component, inject} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatButton} from '@angular/material/button';
import {MatOption} from '@angular/material/core';
import {MatSelect} from '@angular/material/select';
import {JsonPipe} from '@angular/common';
import {OrderService} from '../../../core/services/order-service';
import {CartService} from '../../../core/services/cart-service';
import {map, take} from 'rxjs';
import {Order} from '../../../core/models/order';

@Component({
  selector: 'app-checkout-page',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatSelect,
    MatOption,
    MatButton,
    MatSelect,
    MatOption,
    JsonPipe
  ],
  templateUrl: './checkout-page.html',
  styleUrl: './checkout-page.scss',
})

export class CheckoutPage {
    private fb = inject(FormBuilder);

    readonly form = this.fb.group({
      customer: this.fb.group({
        firstName: ['',Validators.required, Validators.minLength(2)],
        lastName: ['',Validators.required, Validators.minLength(2)],
        email: ['',Validators.required, Validators.email]
      }),
      address: this.fb.group({
        street: ['',Validators.required],
        city: ['',Validators.required],
        zip: ['',Validators.required]
      }),
      shippingMethod: ['standard',Validators.required],
      privacy: [false,Validators.requiredTrue]
    });

  getControl(path: string) {
      return this.form.get(path);
  }

  hasError(path: string, errorCode: string): boolean {
      const control = this.getControl(path);
      return !!control && control.hasError(errorCode) && control.touched;
  }

  private cart = inject(CartService);
  private orderService = inject(OrderService);

  readonly items$ = this.cart.list();
  readonly total$ = this.items$.pipe(map(items=>items.reduce((sum,item)=>sum+item.price,0)));

  loading = false;
  orderSuccess = false;
  orderError = false;

  showSummary = false;

  onSubmit(): void{
    if(this.form.invalid){
      this.form.markAllAsTouched();
      this.showSummary = true;
      this.focusFirstInvalid();
      return;
    }

    this.loading = true;
    this.orderSuccess = false;
    this.orderError = false;
    const value = this.form.getRawValue();

    this.items$.pipe(take(1)).subscribe(items => {
      const order: Order = {
        customer: value.customer!,
        address: value.address!,
        items,
        total: items.reduce(
          (sum, it) => sum + it.price, 0),
        createdAt: new Date().toISOString()
      };
      this.orderService.create(order).subscribe({
        next: () => {
          this.loading = false;
          this.orderSuccess = true;
          this.form.reset();
        },
        error: () => {
          this.loading = false;
          this.orderError = true;
        }
      });
    });
  }

  private focusFirstInvalid(): void {
    const firstInvalid = document.querySelector('form .ng-invalid[formControlName]') as HTMLElement | null;
    firstInvalid?.focus();
  }

}
