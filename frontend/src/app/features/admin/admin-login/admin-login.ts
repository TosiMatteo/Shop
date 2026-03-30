import { Component } from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {AuthService} from '../../../core/services/auth/auth-service';
import {Router} from '@angular/router';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatError, MatFormField, MatInput, MatLabel} from '@angular/material/input';
import {MatButton} from '@angular/material/button';

@Component({
  selector: 'app-admin-login',
  imports: [
    ReactiveFormsModule,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatLabel,
    MatFormField,
    MatError,
    MatInput,
    MatButton
  ],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.scss',
})
export class AdminLogin {
  loginForm: FormGroup;
  errorMessage = '';
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';

    this.authService.loginAdmin(this.loginForm.value).subscribe({
      next: () => this.router.navigate(['/admin/admin-page']),
      error: () => {
        this.errorMessage = 'Credenziali non valide';
        this.loading = false;
      },
    });
  }
}
