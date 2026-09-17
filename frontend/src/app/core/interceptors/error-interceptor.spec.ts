import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { errorInterceptor } from './error-interceptor';
import { ErrorService } from '../services/error-service';
import { AuthService } from '../services/auth/auth-service';

/**
 * Verifica il contratto di gestione degli errori documentato nel README
 * (sezione "Gestione degli errori"): a ogni codice HTTP corrisponde un
 * comportamento preciso del client. I test seguono quella tabella riga per riga.
 *
 * L'interceptor assorbe gli errori restituendo EMPTY: il sottoscrittore riceve
 * un "complete" e mai un "error". L'unica eccezione è il 401 su /sign_in, che
 * viene rilanciato perché il form di login lo deve poter mostrare.
 */
describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let errorServiceMock: jasmine.SpyObj<ErrorService>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let routerMock: jasmine.SpyObj<Router>;

  const URL = '/api/products';

  beforeEach(() => {
    errorServiceMock = jasmine.createSpyObj<ErrorService>('ErrorService', ['setError', 'clearError']);
    authServiceMock = jasmine.createSpyObj<AuthService>('AuthService', ['isAdmin', 'clearSession']);
    routerMock = jasmine.createSpyObj<Router>('Router', ['navigate']);
    authServiceMock.isAdmin.and.returnValue(false);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: ErrorService, useValue: errorServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  /**
   * Esegue una GET che fallisce con lo status indicato e restituisce gli esiti.
   * Il tipo di `body` è quello accettato da TestRequest.flush: i corpi di errore
   * qui sono oggetti JSON o testo semplice.
   */
  function getFailingWith(status: number, body: Object | string | null = null, url = URL) {
    const outcome = { errored: false, completed: false, error: null as any };
    http.get(url).subscribe({
      error: err => {
        outcome.errored = true;
        outcome.error = err;
      },
      complete: () => (outcome.completed = true),
    });
    httpMock.expectOne(url).flush(body, { status, statusText: 'Error' });
    return outcome;
  }

  // ─── Status 0: rete o server non raggiungibile ─────────────────────────────
  it('should retry a GET up to 3 times with increasing delay before giving up', fakeAsync(() => {
    let completed = false;
    http.get(URL).subscribe({ complete: () => (completed = true) });

    // Tentativo iniziale.
    httpMock.expectOne(URL).error(new ProgressEvent('error'), { status: 0 });

    // Tre ritentativi, ritardati di retryCount * 2000 ms.
    [2000, 4000, 6000].forEach(delay => {
      tick(delay);
      httpMock.expectOne(URL).error(new ProgressEvent('error'), { status: 0 });
    });

    expect(errorServiceMock.setError).toHaveBeenCalledWith({
      statusCode: 0,
      message: 'server non disponible',
    });
    expect(completed).toBeTrue();
  }));

  it('should not retry a request that is not a GET', fakeAsync(() => {
    http.post(URL, {}).subscribe();

    httpMock.expectOne(URL).error(new ProgressEvent('error'), { status: 0 });
    tick(10_000);

    // Nessun secondo tentativo: httpMock.verify() dell'afterEach fallirebbe.
    expect(errorServiceMock.setError).toHaveBeenCalledWith({
      statusCode: 0,
      message: 'server non disponible',
    });
  }));

  // ─── 400 ───────────────────────────────────────────────────────────────────
  it('should expose message and details of a 400', () => {
    const outcome = getFailingWith(400, {
      error: { message: 'Parametro mancante', details: ['title'] },
    });

    expect(errorServiceMock.setError).toHaveBeenCalledWith({
      statusCode: 400,
      message: 'Parametro mancante',
      details: ['title'],
    });
    expect(outcome.errored).toBeFalse();
    expect(outcome.completed).toBeTrue();
  });

  // ─── 401 ───────────────────────────────────────────────────────────────────
  it('should rethrow to the caller the 401 of a login request', () => {
    const outcome = { errored: false };
    http.post('/api/customers/sign_in', {}).subscribe({
      error: () => (outcome.errored = true),
    });
    httpMock
      .expectOne('/api/customers/sign_in')
      .flush({ error: { message: 'Credenziali non valide' } }, { status: 401, statusText: 'Unauthorized' });

    expect(outcome.errored).toBeTrue();
    expect(errorServiceMock.setError).toHaveBeenCalledWith({
      statusCode: 401,
      message: 'Credenziali non valide',
      details: [],
    });
    expect(authServiceMock.clearSession).not.toHaveBeenCalled();
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('should clear the session and go to the customer login when the session expires', () => {
    getFailingWith(401, { error: { message: 'Sessione scaduta' } });

    expect(authServiceMock.clearSession).toHaveBeenCalled();
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should go to the admin login when an admin session expires', () => {
    authServiceMock.isAdmin.and.returnValue(true);

    getFailingWith(401, { error: { message: 'Sessione scaduta' } });

    expect(routerMock.navigate).toHaveBeenCalledWith(['/admin/login']);
  });

  it('should use the default message when the 401 has none', () => {
    getFailingWith(401, {});

    expect(errorServiceMock.setError).toHaveBeenCalledWith({
      statusCode: 401,
      message: 'Credenziali errate',
      details: [],
    });
  });

  it('should accept a 401 whose payload exposes the error as a string', () => {
    getFailingWith(401, { error: 'Token non valido' });

    expect(errorServiceMock.setError).toHaveBeenCalledWith({
      statusCode: 401,
      message: 'Token non valido',
      details: [],
    });
  });

  // ─── 403 ───────────────────────────────────────────────────────────────────
  it('should send a customer without permissions to the forbidden page', () => {
    getFailingWith(403, { error: { message: 'Accesso negato' } });

    expect(errorServiceMock.setError).toHaveBeenCalledWith({ statusCode: 403, message: 'Accesso negato' });
    expect(routerMock.navigate).toHaveBeenCalledWith(['/forbidden']);
  });

  it('should keep an admin on the current page on a 403', () => {
    authServiceMock.isAdmin.and.returnValue(true);

    getFailingWith(403, { error: { message: 'Accesso negato' } });

    expect(errorServiceMock.setError).toHaveBeenCalledWith({ statusCode: 403, message: 'Accesso negato' });
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  // ─── 404, 422, 500 ─────────────────────────────────────────────────────────
  it('should report a resource not found', () => {
    getFailingWith(404, { error: { message: 'Risorsa non trovata' } });

    expect(errorServiceMock.setError).toHaveBeenCalledWith({ statusCode: 404, message: 'Risorsa non trovata' });
    expect(routerMock.navigate).not.toHaveBeenCalled();
  });

  it('should expose the invalid fields of a 422', () => {
    getFailingWith(422, {
      error: { message: 'Validazione fallita', details: ['Title non può essere vuoto'] },
    });

    expect(errorServiceMock.setError).toHaveBeenCalledWith({
      statusCode: 422,
      message: 'Validazione fallita',
      details: ['Title non può essere vuoto'],
    });
  });

  it('should report an internal server error', () => {
    getFailingWith(500, { error: { message: 'Si è verificato un errore imprevisto' } });

    expect(errorServiceMock.setError).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Si è verificato un errore imprevisto',
    });
  });

  // ─── Casi non previsti dalla tabella ───────────────────────────────────────
  it('should forward an unhandled status keeping its code', () => {
    getFailingWith(503, { error: { message: 'Servizio non disponibile' } });

    expect(errorServiceMock.setError).toHaveBeenCalledWith({
      statusCode: 503,
      message: 'Servizio non disponibile',
    });
  });

  it('should fall back to a generic message when the payload has an unexpected shape', () => {
    getFailingWith(500, 'testo non json');

    expect(errorServiceMock.setError).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Si è verificato un errore imprevisto',
    });
  });
});
