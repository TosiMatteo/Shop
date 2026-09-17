import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ResetPasswordPage } from './reset-password';
import { AuthService } from '../../../core/services/auth/auth-service';

describe('ResetPasswordPage', () => {
  let component: ResetPasswordPage;
  let fixture: ComponentFixture<ResetPasswordPage>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let navigateSpy: jasmine.Spy;

  const mockPasswords = { password: 'NuovaPassword1', password_confirmation: 'NuovaPassword1' };

  /** Crea il componente come se la pagina fosse aperta con il token indicato. */
  async function createComponent(token: string | null): Promise<void> {
    const queryParams = token ? { reset_password_token: token } : {};

    await TestBed.configureTestingModule({
      imports: [ResetPasswordPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPasswordPage);
    component = fixture.componentInstance;
    navigateSpy = spyOn(TestBed.inject(Router), 'navigate');
    fixture.detectChanges();
  }

  beforeEach(() => {
    authServiceMock = jasmine.createSpyObj<AuthService>('AuthService', ['resetPassword']);
    authServiceMock.resetPassword.and.returnValue(of({}));
  });

  // ─── Token ─────────────────────────────────────────────────────────────────
  describe('reset token', () => {
    it('should create', async () => {
      await createComponent('token-di-prova');

      expect(component).toBeTruthy();
    });

    it('should stay on the page when the token is present', async () => {
      await createComponent('token-di-prova');

      expect(navigateSpy).not.toHaveBeenCalled();
    });

    it('should redirect to /forgot-password when the token is missing', async () => {
      await createComponent(null);

      expect(navigateSpy).toHaveBeenCalledOnceWith(['/forgot-password']);
    });
  });

  // ─── resetForm ─────────────────────────────────────────────────────────────
  describe('resetForm', () => {
    beforeEach(async () => {
      await createComponent('token-di-prova');
    });

    it('should be invalid when empty', () => {
      expect(component.resetForm.invalid).toBeTrue();
    });

    it('should be invalid with a password shorter than six characters', () => {
      component.resetForm.setValue({ password: '12345', password_confirmation: '12345' });

      expect(component.resetForm.get('password')?.hasError('minlength')).toBeTrue();
    });

    it('should be invalid when the passwords do not match', () => {
      component.resetForm.setValue({ ...mockPasswords, password_confirmation: 'diversa' });

      expect(component.resetForm.hasError('passwordMismatch')).toBeTrue();
    });

    it('should be valid with matching passwords', () => {
      component.resetForm.setValue(mockPasswords);

      expect(component.resetForm.valid).toBeTrue();
    });
  });

  // ─── onSubmit() ────────────────────────────────────────────────────────────
  describe('onSubmit()', () => {
    beforeEach(async () => {
      await createComponent('token-di-prova');
    });

    it('should not call authService.resetPassword() when form is invalid', () => {
      component.onSubmit();

      expect(authServiceMock.resetPassword).not.toHaveBeenCalled();
    });

    it('should send token and passwords, then navigate to /login', () => {
      component.resetForm.setValue(mockPasswords);

      component.onSubmit();

      expect(authServiceMock.resetPassword).toHaveBeenCalledOnceWith(
        'token-di-prova',
        mockPasswords.password,
        mockPasswords.password_confirmation,
      );
      expect(navigateSpy).toHaveBeenCalledOnceWith(['/login']);
    });

    it('should show an error message when the reset fails', () => {
      authServiceMock.resetPassword.and.returnValue(throwError(() => new Error('fail')));
      component.resetForm.setValue(mockPasswords);

      component.onSubmit();

      expect(component.loading).toBeFalse();
      expect(component.errorMessage).toContain('Il link è scaduto');
      expect(navigateSpy).not.toHaveBeenCalled();
    });
  });
});
