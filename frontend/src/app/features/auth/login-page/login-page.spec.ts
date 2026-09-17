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
  let navigateSpy: jasmine.Spy;

  const mockCredentials = { email: 'user@example.com', password: 'secret' };

  const mockRegistration = {
    first_name: 'Mario',
    last_name: 'Rossi',
    email: 'mario@example.com',
    password: 'abc123',
    password_confirmation: 'abc123',
  };

  const mockRegisterResponse = new HttpResponse({ body: { message: 'Confirm your email' } });

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'register']);

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    navigateSpy = spyOn(TestBed.inject(Router), 'navigate');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ─── loginForm ─────────────────────────────────────────────────────────────
  describe('loginForm', () => {
    it('should be invalid when empty', () => {
      expect(component.loginForm.invalid).toBeTrue();
    });

    it('should be invalid with a malformed email', () => {
      component.loginForm.setValue({ ...mockCredentials, email: 'not-an-email' });

      expect(component.loginForm.invalid).toBeTrue();
    });

    it('should be valid with correct email and password', () => {
      component.loginForm.setValue(mockCredentials);

      expect(component.loginForm.valid).toBeTrue();
    });
  });

  // ─── onLogin() ─────────────────────────────────────────────────────────────
  describe('onLogin()', () => {
    it('should not call authService.login() when form is invalid', () => {
      component.onLogin();

      expect(authServiceMock.login).not.toHaveBeenCalled();
    });

    it('should call authService.login() and navigate to /products on success', () => {
      authServiceMock.login.and.returnValue(of({} as any));
      component.loginForm.setValue(mockCredentials);

      component.onLogin();

      expect(authServiceMock.login).toHaveBeenCalledOnceWith(mockCredentials);
      expect(navigateSpy).toHaveBeenCalledOnceWith(['/products']);
    });
  });

  // ─── passwordMatchValidator ────────────────────────────────────────────────
  describe('passwordMatchValidator', () => {
    it('should set passwordMismatch error when passwords do not match', () => {
      component.registerForm.patchValue({ password: 'abc123', password_confirmation: 'different' });
      component.registerForm.updateValueAndValidity();

      expect(component.registerForm.hasError('passwordMismatch')).toBeTrue();
      expect(
        component.registerForm.get('password_confirmation')?.hasError('passwordMismatch'),
      ).toBeTrue();
    });

    it('should clear passwordMismatch error when passwords match', () => {
      // Prima si crea l'errore, poi lo si corregge.
      component.registerForm.patchValue({ password: 'abc123', password_confirmation: 'different' });
      component.registerForm.updateValueAndValidity();

      component.registerForm.patchValue({ password_confirmation: 'abc123' });
      component.registerForm.updateValueAndValidity();

      expect(component.registerForm.hasError('passwordMismatch')).toBeFalse();
      expect(
        component.registerForm.get('password_confirmation')?.hasError('passwordMismatch'),
      ).toBeFalse();
    });
  });

  // ─── registerForm ──────────────────────────────────────────────────────────
  describe('registerForm', () => {
    it('should be invalid when empty', () => {
      expect(component.registerForm.invalid).toBeTrue();
    });

    it('should be invalid when first_name contains only whitespace', () => {
      component.registerForm.setValue({ ...mockRegistration, first_name: '   ' });

      expect(component.registerForm.get('first_name')?.invalid).toBeTrue();
    });
  });

  // ─── onRegister() ──────────────────────────────────────────────────────────
  describe('onRegister()', () => {
    beforeEach(() => {
      authServiceMock.register.and.returnValue(of(mockRegisterResponse));
    });

    it('should not call authService.register() when form is invalid', () => {
      component.onRegister();

      expect(authServiceMock.register).not.toHaveBeenCalled();
    });

    it('should call authService.register() with trimmed payload on valid submit', () => {
      component.registerForm.setValue({
        ...mockRegistration,
        first_name: '  Mario  ',
        last_name: '  Rossi  ',
      });

      component.onRegister();

      expect(authServiceMock.register).toHaveBeenCalledOnceWith(mockRegistration);
    });

    it('should set registrationPending and registrationMessage on success', () => {
      component.registerForm.setValue(mockRegistration);

      component.onRegister();

      expect(component.registrationPending).toBeTrue();
      expect(component.registrationMessage).toBe('Confirm your email');
    });

    it('should reset the form after successful registration', () => {
      component.registerForm.setValue(mockRegistration);

      component.onRegister();

      expect(component.registerForm.pristine).toBeTrue();
    });
  });
});
