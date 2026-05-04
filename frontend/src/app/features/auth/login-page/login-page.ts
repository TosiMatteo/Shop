import { Component } from '@angular/core';
import {MatButton, MatIconButton} from '@angular/material/button';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatError, MatFormField, MatInput, MatLabel, MatSuffix} from '@angular/material/input';
import {AuthService} from '../../../core/services/auth/auth-service';
import {Router, RouterLink} from '@angular/router';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatTab, MatTabGroup} from '@angular/material/tabs';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'app-login-page',
  imports: [
    MatButton,
    ReactiveFormsModule,
    MatInput,
    MatLabel,
    MatFormField,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatTabGroup,
    MatTab,
    MatError,
    MatIconButton,
    MatIcon,
    MatSuffix,
    RouterLink
  ],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {
  loginForm: FormGroup;
  registerForm: FormGroup;

  hideLoginPassword = true;
  hideRegisterPassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });

    this.registerForm = this.fb.group({
      first_name: ['', [Validators.required, Validators.pattern(/^.*\S.*$/)]],
      last_name: ['', [Validators.required, Validators.pattern(/^.*\S.*$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      password_confirmation: ['', Validators.required],
    });
  }

  onLogin(): void {
    if (this.loginForm.invalid) return;

    // Login success creates a session; redirect to the authenticated landing page.
    this.authService.login(this.loginForm.value).subscribe({
      next: () => this.router.navigate(['/dashboard']),
    });
  }

  onRegister(): void {
    if (this.registerForm.invalid) return;

    // Sanitize first_name, last_name and email fields.
    const raw = this.registerForm.value;
    const payload = {
      first_name: raw.first_name.trim(),
      last_name: raw.last_name.trim(),
      email: raw.email.trim(),
      password: raw.password,
      password_confirmation: raw.password_confirmation,
    };

    //Check after sanitize
    if (!payload.first_name || !payload.last_name || !payload.email) {
      console.error('I campi nome, cognome ed email non possono contenere solo spazi');
      return;
    }

    // Registration endpoint also authenticates user on success.
    this.authService.register(payload).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => console.error('Registrazione fallita', err),
    });
  }
}
