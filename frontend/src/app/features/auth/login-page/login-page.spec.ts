import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';

import { LoginPage } from './login-page';
import { AuthService } from '../../../core/services/auth/auth-service';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'register']);

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ─── loginForm ────────────────────────────────────────────────────────────

  describe('loginForm', () => {
    it('should be invalid when empty', () => {
      expect(component.loginForm.invalid).toBeTrue();
    });

    it('should be invalid with a malformed email', () => {
      component.loginForm.setValue({ email: 'not-an-email', password: 'secret' });
      expect(component.loginForm.invalid).toBeTrue();
    });

    it('should be valid with correct email and password', () => {
      component.loginForm.setValue({ email: 'user@example.com', password: 'secret' });
      expect(component.loginForm.valid).toBeTrue();
    });
  });

  // ─── onLogin() ────────────────────────────────────────────────────────────

  describe('onLogin()', () => {
    it('should not call authService.login() when form is invalid', () => {
      component.onLogin();
      expect(authServiceMock.login).not.toHaveBeenCalled();
    });

    it('should call authService.login() and navigate to /dashboard on success', () => {
      authServiceMock.login.and.returnValue(of({} as any));
      component.loginForm.setValue({ email: 'user@example.com', password: 'secret' });

      component.onLogin();

      expect(authServiceMock.login).toHaveBeenCalledOnceWith({ email: 'user@example.com', password: 'secret' });
      expect(router.navigate).toHaveBeenCalledOnceWith(['/dashboard']);
    });
  });

  // ─── passwordMatchValidator ───────────────────────────────────────────────

  describe('passwordMatchValidator', () => {
    it('should set passwordMismatch error when passwords do not match', () => {
      component.registerForm.patchValue({ password: 'abc123', password_confirmation: 'different' });
      component.registerForm.updateValueAndValidity();

      expect(component.registerForm.hasError('passwordMismatch')).toBeTrue();
      expect(component.registerForm.get('password_confirmation')?.hasError('passwordMismatch')).toBeTrue();
    });

    it('should clear passwordMismatch error when passwords match', () => {
      // First create the mismatch state, then fix it.
      component.registerForm.patchValue({ password: 'abc123', password_confirmation: 'different' });
      component.registerForm.updateValueAndValidity();

      component.registerForm.patchValue({ password_confirmation: 'abc123' });
      component.registerForm.updateValueAndValidity();

      expect(component.registerForm.hasError('passwordMismatch')).toBeFalse();
      expect(component.registerForm.get('password_confirmation')?.hasError('passwordMismatch')).toBeFalse();
    });
  });

  // ─── registerForm ─────────────────────────────────────────────────────────

  describe('registerForm', () => {
    it('should be invalid when empty', () => {
      expect(component.registerForm.invalid).toBeTrue();
    });

    it('should be invalid when first_name contains only whitespace', () => {
      component.registerForm.setValue({
        first_name: '   ',
        last_name: 'Rossi',
        email: 'mario@example.com',
        password: 'abc123',
        password_confirmation: 'abc123',
      });
      expect(component.registerForm.get('first_name')?.invalid).toBeTrue();
    });
  });

  // ─── onRegister() ─────────────────────────────────────────────────────────

  describe('onRegister()', () => {
    it('should not call authService.register() when form is invalid', () => {
      component.onRegister();
      expect(authServiceMock.register).not.toHaveBeenCalled();
    });

    it('should call authService.register() with trimmed payload on valid submit', () => {
      const mockResponse = new HttpResponse({ body: { message: 'Confirm your email' } });
      authServiceMock.register.and.returnValue(of(mockResponse));

      component.registerForm.setValue({
        first_name: '  Mario  ',
        last_name: '  Rossi  ',
        email: 'mario@example.com',
        password: 'abc123',
        password_confirmation: 'abc123',
      });

      component.onRegister();

      expect(authServiceMock.register).toHaveBeenCalledOnceWith({
        first_name: 'Mario',
        last_name: 'Rossi',
        email: 'mario@example.com',
        password: 'abc123',
        password_confirmation: 'abc123',
      });
    });

    it('should set registrationPending and registrationMessage on success', () => {
      const mockResponse = new HttpResponse({ body: { message: 'Confirm your email' } });
      authServiceMock.register.and.returnValue(of(mockResponse));

      component.registerForm.setValue({
        first_name: 'Mario',
        last_name: 'Rossi',
        email: 'mario@example.com',
        password: 'abc123',
        password_confirmation: 'abc123',
      });

      component.onRegister();

      expect(component.registrationPending).toBeTrue();
      expect(component.registrationMessage).toBe('Confirm your email');
    });

    it('should reset the form after successful registration', () => {
      const mockResponse = new HttpResponse({ body: { message: 'Confirm your email' } });
      authServiceMock.register.and.returnValue(of(mockResponse));

      component.registerForm.setValue({
        first_name: 'Mario',
        last_name: 'Rossi',
        email: 'mario@example.com',
        password: 'abc123',
        password_confirmation: 'abc123',
      });

      component.onRegister();

      expect(component.registerForm.pristine).toBeTrue();
    });
  });
});
