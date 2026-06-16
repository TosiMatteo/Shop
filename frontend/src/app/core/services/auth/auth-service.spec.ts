import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth-service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // assicura che non ci siano richieste HTTP pendenti
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should store token, user_type and member_since on successful customer login', () => {
      const credentials = { email: 'test@example.com', password: 'password123' };
      const mockResponseBody = { user: { id: 1, email: 'test@example.com', member_since: 2023 } };
      const mockToken = 'Bearer token123';

      service.login(credentials).subscribe(response => {
        expect(response.body).toEqual(mockResponseBody);
      });

      const req = httpMock.expectOne('/api/customers/sign_in');
      expect(req.request.method).toBe('POST');
      req.flush(mockResponseBody, {
        headers: { Authorization: mockToken },
        status: 200,
        statusText: 'OK',
      });

      expect(localStorage.getItem('auth_token')).toBe(mockToken);
      expect(localStorage.getItem('user_type')).toBe('Customer');
      expect(localStorage.getItem('member_since')).toBe('2023');
    });

    it('should not store token if Authorization header is missing', () => {
      const credentials = { email: 'test@example.com', password: 'password123' };
      service.login(credentials).subscribe();

      const req = httpMock.expectOne('/api/customers/sign_in');
      req.flush({});

      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });

  describe('loginAdmin', () => {
    it('should store token and user_type Admin on successful login', () => {
      const credentials = { email: 'admin@shop.com', password: 'admin123' };
      const mockToken = 'Bearer adminToken';

      service.loginAdmin(credentials).subscribe();

      const req = httpMock.expectOne('/api/admins/sign_in');
      req.flush({}, {
        headers: { Authorization: mockToken },
        status: 200,
        statusText: 'OK',
      });

      expect(localStorage.getItem('auth_token')).toBe(mockToken);
      expect(localStorage.getItem('user_type')).toBe('Admin');
    });
  });

  describe('logout', () => {
    it('should clear session data after server logout', () => {
      // Pre‑populate localStorage per simulare sessione attiva
      localStorage.setItem('auth_token', 'token');
      localStorage.setItem('user_type', 'Customer');
      localStorage.setItem('member_since', '2023');

      service.logout().subscribe();

      const req = httpMock.expectOne('/api/customers/sign_out');
      expect(req.request.method).toBe('DELETE');
      req.flush({});

      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('user_type')).toBeNull();
      expect(localStorage.getItem('member_since')).toBeNull();
    });
  });

  describe('register', () => {
    it('should POST registration data and return response', () => {
      const regData = {
        first_name: 'Mario',
        last_name: 'Rossi',
        email: 'mario@example.com',
        password: 'Password123!',
        password_confirmation: 'Password123!',
      };

      service.register(regData).subscribe(response => {
        expect(response.body).toEqual({ message: 'Registrazione completata' });
      });

      const req = httpMock.expectOne('/api/customers');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ customer: regData });
      req.flush({ message: 'Registrazione completata' }, { status: 201, statusText: 'Created' });
    });
  });

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

  describe('clearSession', () => {
    it('should remove all localStorage items and emit logout event', () => {
      localStorage.setItem('auth_token', 'token');
      localStorage.setItem('user_type', 'Customer');
      localStorage.setItem('member_since', '2023');

      let emitted = false;
      service.logoutEvent$.subscribe(() => emitted = true);

      service.clearSession();

      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('user_type')).toBeNull();
      expect(localStorage.getItem('member_since')).toBeNull();
      expect(emitted).toBeTrue();
    });
  });

  describe('password flows', () => {
    it('should call POST for forgot password', () => {
      service.forgotPassword('user@example.com').subscribe();

      const req = httpMock.expectOne('/api/customers/password');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ customer: { email: 'user@example.com' } });
      req.flush({});
    });

    it('should call PUT for reset password', () => {
      const token = 'reset123';
      const password = 'NewPass123!';
      const passwordConfirmation = 'NewPass123!';

      service.resetPassword(token, password, passwordConfirmation).subscribe();

      const req = httpMock.expectOne('/api/customers/password');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({
        customer: {
          reset_password_token: token,
          password: password,
          password_confirmation: passwordConfirmation,
        },
      });
      req.flush({});
    });
  });
});
