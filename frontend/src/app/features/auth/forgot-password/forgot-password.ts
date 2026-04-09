import { Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatError, MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { AuthService } from '../../../core/services/auth/auth-service';

@Component({
  selector: 'app-forgot-password-page',
  imports: [
    MatButton,
    ReactiveFormsModule,
    MatInput,
    MatLabel,
    MatFormField,
    MatError,
    RouterLink,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
  ],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPasswordPage {
  forgotForm: FormGroup;
  submitted = false;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit(): void {
    if (this.forgotForm.invalid) return;

    this.loading = true;

    this.authService.forgotPassword(this.forgotForm.value.email).subscribe({
      // Mostriamo sempre il messaggio generico, indipendentemente dall'esito,
      // per evitare che un attaccante possa enumerare gli utenti registrati.
      next: () => this.handleCompletion(),
      error: () => this.handleCompletion(),
    });
  }

  private handleCompletion(): void {
    this.loading = false;
    this.submitted = true;
  }
}
