import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CartService } from '../../../core/services/cart/cart-service';
import {CartCardComponent} from '../cart-card/cart-card';
import {finalize} from 'rxjs';

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
    CartCardComponent,
  ],
  templateUrl: './checkout-page.html',
  styleUrl: './checkout-page.scss',
})
export class CheckoutPage {
  private fb = inject(FormBuilder);
  private cartService = inject(CartService);
  private router = inject(Router);

  readonly form = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName:  ['', [Validators.required, Validators.minLength(2)]],
    street:    ['', Validators.required],
    city:      ['', Validators.required],
    zip:       ['', Validators.required],
    privacy:   [false, Validators.requiredTrue],
  });

  loading = false;
  orderSuccess = false;

  // Show field errors only after user interaction.
  hasError(field: string, errorCode: string): boolean {
    const control = this.form.get(field);
    return !!control && control.hasError(errorCode) && control.touched;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      // Surface all validation messages and move focus to the first invalid field.
      this.form.markAllAsTouched();
      this.focusFirstInvalid();
      return;
    }

    this.loading = true;
    const { firstName, lastName, street, city, zip } = this.form.getRawValue();

    this.cartService
      .checkout({
        name: `${firstName} ${lastName}`.trim(),
        street: street!,
        city: city!,
        zip: zip!,
      }).pipe(
        finalize(() => this.loading = false)
    )
      .subscribe({
        next: () => {
          this.orderSuccess = true;
          this.form.reset();
          // Navigate to orders after a short success feedback delay.
          setTimeout(() => this.router.navigate(['/orders']), 2000);
        }
      });
  }

  private focusFirstInvalid(): void {
    // Improves accessibility/usability on validation failure.
    const el = document.querySelector('form .ng-invalid[formControlName]') as HTMLElement | null;
    el?.focus();
  }
}
