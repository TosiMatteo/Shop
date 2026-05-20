import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router, provideRouter } from '@angular/router';
import { adminGuard } from './admin-guard';
import { AuthService } from '../services/auth/auth-service';

describe('adminGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => adminGuard(...guardParameters));

  let authServiceMock: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authServiceMock = jasmine.createSpyObj<AuthService>('AuthService', ['isAuthenticated', 'isAdmin']);

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

  it('should return true when user is authenticated and is admin', () => {
    authServiceMock.isAuthenticated.and.returnValue(true);
    authServiceMock.isAdmin.and.returnValue(true);

    const result = executeGuard(null as any, null as any);

    expect(result).toBeTrue();
  });

  it('should redirect to /admin/login when user is not authenticated', () => {
    authServiceMock.isAuthenticated.and.returnValue(false);
    const router = TestBed.inject(Router);

    const result = executeGuard(null as any, null as any);

    expect(result).toEqual(router.createUrlTree(['/admin/login']));
  });

  it('should redirect to /forbidden when user is authenticated but not admin', () => {
    authServiceMock.isAuthenticated.and.returnValue(true);
    authServiceMock.isAdmin.and.returnValue(false);
    const router = TestBed.inject(Router);

    const result = executeGuard(null as any, null as any);

    expect(result).toEqual(router.createUrlTree(['/forbidden']));
  });
});
