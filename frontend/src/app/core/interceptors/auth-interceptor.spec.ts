import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthInterceptor } from './auth-interceptor';
import { AuthService } from '../services/auth/auth-service';

/**
 * L'interceptor allega il token a ogni richiesta quando esiste, e lascia
 * passare invariate quelle degli utenti non autenticati (endpoint pubblici).
 */
describe('AuthInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceMock: jasmine.SpyObj<AuthService>;

  const URL = '/api/products';

  beforeEach(() => {
    authServiceMock = jasmine.createSpyObj<AuthService>('AuthService', ['getToken']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([AuthInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceMock },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should attach the token in the Authorization header when it exists', () => {
    authServiceMock.getToken.and.returnValue('Bearer token-di-prova');

    http.get(URL).subscribe();

    const req = httpMock.expectOne(URL);
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-di-prova');
    req.flush([]);
  });

  it('should not add any header when there is no token', () => {
    authServiceMock.getToken.and.returnValue(null);

    http.get(URL).subscribe();

    const req = httpMock.expectOne(URL);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush([]);
  });

  it('should leave the rest of the request unchanged', () => {
    authServiceMock.getToken.and.returnValue('Bearer token-di-prova');
    const body = { cart_item: { product_id: 1, quantity: 2 } };

    http.post(URL, body).subscribe();

    const req = httpMock.expectOne(URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({});
  });
});
