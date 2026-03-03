import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CartService } from '../../../core/services/cart/cart-service';
import {CartCardComponent} from '../cart-card/cart-card';

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
    email:     ['', [Validators.required, Validators.email]],
    street:    ['', Validators.required],
    city:      ['', Validators.required],
    zip:       ['', Validators.required],
    privacy:   [false, Validators.requiredTrue],
  });

  loading = false;
  orderSuccess = false;
  orderError: string | null = null;

  hasError(field: string, errorCode: string): boolean {
    const control = this.form.get(field);
    return !!control && control.hasError(errorCode) && control.touched;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.focusFirstInvalid();
      return;
    }

    this.loading = true;
    this.orderError = null;

    const { firstName, lastName, street, city, zip } = this.form.getRawValue();

    this.cartService
      .checkout({
        // Il backend Rails si aspetta "name" come stringa unica
        name: `${firstName} ${lastName}`.trim(),
        street: street!,
        city: city!,
        zip: zip!,
      })
      .subscribe({
        next: () => {
          this.loading = false;
          this.orderSuccess = true;
          this.form.reset();
          // Reindirizza alla pagina di conferma dopo 2 secondi
          setTimeout(() => this.router.navigate(['/orders']), 2000);
        },
        error: (err) => {
          this.loading = false;
          this.orderError =
            err?.error?.errors?.join(', ') ?? 'Si è verificato un errore. Riprova.';
        },
      });
  }

  private focusFirstInvalid(): void {
    const el = document.querySelector('form .ng-invalid[formControlName]') as HTMLElement | null;
    el?.focus();
  }
}
