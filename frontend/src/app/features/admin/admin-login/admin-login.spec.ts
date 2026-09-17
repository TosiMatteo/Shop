import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { AdminLogin } from './admin-login';
import { AuthService } from '../../../core/services/auth/auth-service';

describe('AdminLogin', () => {
  let component: AdminLogin;
  let fixture: ComponentFixture<AdminLogin>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let navigateSpy: jasmine.Spy;

  const mockCredentials = { email: 'admin@shop.com', password: 'secret' };

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj<AuthService>('AuthService', ['loginAdmin']);
    authServiceMock.loginAdmin.and.returnValue(of({} as any));

    await TestBed.configureTestingModule({
      imports: [AdminLogin],
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminLogin);
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

  // ─── onSubmit() ────────────────────────────────────────────────────────────
  describe('onSubmit()', () => {
    it('should not call authService.loginAdmin() when form is invalid', () => {
      component.onSubmit();

      expect(authServiceMock.loginAdmin).not.toHaveBeenCalled();
    });

    it('should call authService.loginAdmin() and navigate to the admin page on success', () => {
      component.loginForm.setValue(mockCredentials);

      component.onSubmit();

      expect(authServiceMock.loginAdmin).toHaveBeenCalledOnceWith(mockCredentials);
      expect(navigateSpy).toHaveBeenCalledOnceWith(['/admin/admin-page']);
      expect(component.loading).toBeFalse();
    });

    it('should keep loading true while the request is in flight', () => {
      const login$ = new Subject<any>();
      authServiceMock.loginAdmin.and.returnValue(login$);
      component.loginForm.setValue(mockCredentials);

      component.onSubmit();
      expect(component.loading).toBeTrue();

      login$.next({});
      login$.complete();

      expect(component.loading).toBeFalse();
    });

    it('should show an error message when the credentials are rejected', () => {
      authServiceMock.loginAdmin.and.returnValue(throwError(() => new Error('401')));
      component.loginForm.setValue(mockCredentials);

      component.onSubmit();
      fixture.detectChanges();

      expect(component.loading).toBeFalse();
      expect(component.errorMessage).toBe('Email o password non corretti');
      expect(fixture.nativeElement.querySelector('.global-error')?.textContent).toContain(
        'Email o password non corretti',
      );
      expect(navigateSpy).not.toHaveBeenCalled();
    });

    it('should clear the previous error message on a new submit', () => {
      component.errorMessage = 'Email o password non corretti';
      component.loginForm.setValue(mockCredentials);

      component.onSubmit();

      expect(component.errorMessage).toBe('');
    });
  });
});
