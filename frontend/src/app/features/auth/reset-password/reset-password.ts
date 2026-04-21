import { Component, OnInit } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatError, MatFormField, MatInput, MatLabel, MatSuffix } from '@angular/material/input';
import { MatIcon } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { AuthService } from '../../../core/services/auth/auth-service';

function passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
  // Cross-field validator for password confirmation.
  const password = group.get('password')?.value;
  const confirmation = group.get('password_confirmation')?.value;
  return password === confirmation ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-reset-password-page',
  imports: [
    MatButton,
    MatIconButton,
    ReactiveFormsModule,
    MatInput,
    MatLabel,
    MatFormField,
    MatSuffix,
    MatIcon,
    MatError,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
  ],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.scss',
})
export class ResetPasswordPage implements OnInit {
  resetForm: FormGroup;
  hidePassword = true;
  hideConfirmPassword = true;
  loading = false;
  errorMessage = '';

  private resetToken = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.resetForm = this.fb.group(
      {
        password: ['', [Validators.required, Validators.minLength(6)]],
        password_confirmation: ['', Validators.required],
      },
      { validators: passwordMatchValidator }
    );
  }

  ngOnInit(): void {
    // Reset token is provided as query param in the password-reset email link.
    this.resetToken = this.route.snapshot.queryParamMap.get('reset_password_token') ?? '';

    if (!this.resetToken) {
      // Missing token means user opened page without a valid reset URL.
      this.router.navigate(['/forgot-password']);
    }
  }

  onSubmit(): void {
    if (this.resetForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';

    const { password, password_confirmation } = this.resetForm.value;

    // Complete reset flow, then send user back to login.
    this.authService.resetPassword(this.resetToken, password, password_confirmation).subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => {
        this.loading = false;
        this.errorMessage = 'Il link è scaduto o non è valido. Richiedi un nuovo link di recupero.';
      },
    });
  }
}
