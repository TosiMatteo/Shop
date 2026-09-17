import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth-service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const mockCredentials = { email: 'test@example.com', password: 'password123' };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), AuthService],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  /** Simula una sessione attiva di un cliente. */
  function storeCustomerSession(): void {
    localStorage.setItem('auth_token', 'token');
    localStorage.setItem('user_type', 'Customer');
    localStorage.setItem('member_since', '2023');
  }

  function expectSessionCleared(): void {
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('user_type')).toBeNull();
    expect(localStorage.getItem('member_since')).toBeNull();
  }

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── login ─────────────────────────────────────────────────────────────────
  describe('login', () => {
    it('should store token, user_type and member_since on successful customer login', () => {
      const mockResponseBody = { user: { id: 1, email: 'test@example.com', member_since: 2023 } };
      let body: unknown;

      service.login(mockCredentials).subscribe(response => (body = response.body));

      const req = httpMock.expectOne('/api/customers/sign_in');
      expect(req.request.method).toBe('POST');
      req.flush(mockResponseBody, {
        headers: { Authorization: 'Bearer token123' },
        status: 200,
        statusText: 'OK',
      });

      expect(body).toEqual(mockResponseBody);
      expect(localStorage.getItem('auth_token')).toBe('Bearer token123');
      expect(localStorage.getItem('user_type')).toBe('Customer');
      expect(localStorage.getItem('member_since')).toBe('2023');
    });

    it('should not store token if Authorization header is missing', () => {
      service.login(mockCredentials).subscribe();

      httpMock.expectOne('/api/customers/sign_in').flush({});

      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });

  // ─── loginAdmin ────────────────────────────────────────────────────────────
  describe('loginAdmin', () => {
    it('should store token and user_type Admin on successful login', () => {
      service.loginAdmin({ email: 'admin@shop.com', password: 'admin123' }).subscribe();

      httpMock.expectOne('/api/admins/sign_in').flush(
        {},
        { headers: { Authorization: 'Bearer adminToken' }, status: 200, statusText: 'OK' },
      );

      expect(localStorage.getItem('auth_token')).toBe('Bearer adminToken');
      expect(localStorage.getItem('user_type')).toBe('Admin');
    });
  });

  // ─── logout ────────────────────────────────────────────────────────────────
  describe('logout', () => {
    it('should clear session data after server logout', () => {
      storeCustomerSession();

      service.logout().subscribe();

      const req = httpMock.expectOne('/api/customers/sign_out');
      expect(req.request.method).toBe('DELETE');
      req.flush({});

      expectSessionCleared();
    });
  });

  // ─── register ──────────────────────────────────────────────────────────────
  describe('register', () => {
    it('should POST registration data and return response', () => {
      const mockRegistration = {
        first_name: 'Mario',
        last_name: 'Rossi',
        email: 'mario@example.com',
        password: 'Password123!',
        password_confirmation: 'Password123!',
      };
      let body: unknown;

      service.register(mockRegistration).subscribe(response => (body = response.body));

      const req = httpMock.expectOne('/api/customers');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ customer: mockRegistration });
      req.flush({ message: 'Registrazione completata' }, { status: 201, statusText: 'Created' });

      expect(body).toEqual({ message: 'Registrazione completata' });
    });
  });

  // ─── Token e ruolo ─────────────────────────────────────────────────────────
  describe('token and role helpers', () => {
    it('should return true for isAuthenticated when token exists', () => {
      localStorage.setItem('auth_token', 'any');

      expect(service.isAuthenticated()).toBeTrue();
    });

    it('should return false for isAuthenticated when token missing', () => {
      expect(service.isAuthenticated()).toBeFalse();
    });

    it('should return true for isAdmin when user_type is Admin', () => {
      localStorage.setItem('user_type', 'Admin');

      expect(service.isAdmin()).toBeTrue();
    });

    it('should return member_since as number', () => {
      localStorage.setItem('member_since', '2023');

      expect(service.getMemberSince()).toBe(2023);
    });

    it('should return null for member_since if not set', () => {
      expect(service.getMemberSince()).toBeNull();
    });
  });

  // ─── clearSession ──────────────────────────────────────────────────────────
  describe('clearSession', () => {
    it('should remove all localStorage items and emit logout event', () => {
      storeCustomerSession();
      let emitted = false;
      service.logoutEvent$.subscribe(() => (emitted = true));

      service.clearSession();

      expectSessionCleared();
      expect(emitted).toBeTrue();
    });
  });

  // ─── Recupero password ─────────────────────────────────────────────────────
  describe('password flows', () => {
    it('should call POST for forgot password', () => {
      service.forgotPassword('user@example.com').subscribe();

      const req = httpMock.expectOne('/api/customers/password');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ customer: { email: 'user@example.com' } });
      req.flush({});
    });

    it('should call PUT for reset password', () => {
      service.resetPassword('reset123', 'NewPass123!', 'NewPass123!').subscribe();

      const req = httpMock.expectOne('/api/customers/password');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({
        customer: {
          reset_password_token: 'reset123',
          password: 'NewPass123!',
          password_confirmation: 'NewPass123!',
        },
      });
      req.flush({});
    });
  });
});
