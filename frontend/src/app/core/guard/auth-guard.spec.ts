import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router, provideRouter } from '@angular/router';
import { authGuard } from './auth-guard';
import { AuthService } from '../services/auth/auth-service';

describe('authGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => authGuard(...guardParameters));

  let authServiceMock: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authServiceMock = jasmine.createSpyObj<AuthService>('AuthService', ['isAuthenticated']);

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
      ],
    });
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });

  it('should return true when user is authenticated', () => {
    authServiceMock.isAuthenticated.and.returnValue(true);

    const result = executeGuard(null as any, null as any);

    expect(result).toBeTrue();
  });

  it('should redirect to /login when user is not authenticated', () => {
    authServiceMock.isAuthenticated.and.returnValue(false);
    const router = TestBed.inject(Router);

    const result = executeGuard(null as any, null as any);

    expect(result).toEqual(router.createUrlTree(['/login']));
  });
});
