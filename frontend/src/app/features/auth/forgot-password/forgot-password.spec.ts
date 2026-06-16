import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ForgotPasswordPage } from './forgot-password';
import { AuthService } from '../../../core/services/auth/auth-service';

describe('ForgotPassword', () => {
  let component: ForgotPasswordPage;
  let fixture: ComponentFixture<ForgotPasswordPage>;
  let authServiceMock: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj<AuthService>('AuthService', ['forgotPassword']);
    authServiceMock.forgotPassword.and.returnValue(of(null));

    await TestBed.configureTestingModule({
      imports: [ForgotPasswordPage],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ─── forgotForm validation ─────────────────────────────────────────────
  it('should invalidate form when empty', () => {
    expect(component.forgotForm.invalid).toBeTrue();
  });

  it('should invalidate form with a malformed email', () => {
    component.forgotForm.setValue({ email: 'not-an-email' });
    expect(component.forgotForm.invalid).toBeTrue();
  });

  it('should validate form with a correct email', () => {
    component.forgotForm.setValue({ email: 'test@example.com' });
    expect(component.forgotForm.valid).toBeTrue();
  });

  // ─── onSubmit() ────────────────────────────────────────────────────────
  it('should not call forgotPassword when form is invalid', () => {
    component.onSubmit();
    expect(authServiceMock.forgotPassword).not.toHaveBeenCalled();
  });

  it('should call forgotPassword with email and set loading / submitted on success', () => {
    component.forgotForm.setValue({ email: 'user@example.com' });
    component.onSubmit();

    expect(authServiceMock.forgotPassword).toHaveBeenCalledOnceWith('user@example.com');
    expect(component.loading).toBeFalse();   // dopo la risposta
    expect(component.submitted).toBeTrue();
  });

  it('should set loading and submitted even when the call fails', () => {
    authServiceMock.forgotPassword.and.returnValue(throwError(() => new Error('fail')));
    component.forgotForm.setValue({ email: 'user@example.com' });
    component.onSubmit();

    expect(authServiceMock.forgotPassword).toHaveBeenCalled();
    expect(component.loading).toBeFalse();
    expect(component.submitted).toBeTrue();
  });
});
