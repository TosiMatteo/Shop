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
  let errorService: jasmine.SpyObj<ErrorService>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  const URL = '/api/products';

  beforeEach(() => {
    errorService = jasmine.createSpyObj<ErrorService>('ErrorService', ['setError', 'clearError']);
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['isAdmin', 'clearSession']);
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    authService.isAdmin.and.returnValue(false);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: ErrorService, useValue: errorService },
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
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

  // ─── Status 0: rete o server non raggiungibile ──────────────────────────────
  it('riprova una GET fino a 3 volte con attesa crescente prima di arrendersi', fakeAsync(() => {
    let completed = false;
    http.get(URL).subscribe({ complete: () => (completed = true) });

    // Tentativo iniziale.
    httpMock.expectOne(URL).error(new ProgressEvent('error'), { status: 0 });

    // Tre ritentativi, ritardati di retryCount * 2000 ms.
    [2000, 4000, 6000].forEach(delay => {
      tick(delay);
      httpMock.expectOne(URL).error(new ProgressEvent('error'), { status: 0 });
    });

    expect(errorService.setError).toHaveBeenCalledWith({
      statusCode: 0,
      message: 'server non disponible',
    });
    expect(completed).toBeTrue();
  }));

  it('non riprova una richiesta che non sia una GET', fakeAsync(() => {
    http.post(URL, {}).subscribe();

    httpMock.expectOne(URL).error(new ProgressEvent('error'), { status: 0 });
    tick(10_000);

    // Nessun secondo tentativo: httpMock.verify() dell'afterEach fallirebbe.
    expect(errorService.setError).toHaveBeenCalledWith({
      statusCode: 0,
      message: 'server non disponible',
    });
  }));

  // ─── 400 ────────────────────────────────────────────────────────────────────
  it('espone messaggio e dettagli di un 400', () => {
    const outcome = getFailingWith(400, {
      error: { message: 'Parametro mancante', details: ['title'] },
    });

    expect(errorService.setError).toHaveBeenCalledWith({
      statusCode: 400,
      message: 'Parametro mancante',
      details: ['title'],
    });
    expect(outcome.errored).toBeFalse();
    expect(outcome.completed).toBeTrue();
  });

  // ─── 401 ────────────────────────────────────────────────────────────────────
  it('rilancia al chiamante il 401 di una richiesta di login', () => {
    const outcome = { errored: false };
    http.post('/api/customers/sign_in', {}).subscribe({
      error: () => (outcome.errored = true),
    });
    httpMock
      .expectOne('/api/customers/sign_in')
      .flush({ error: { message: 'Credenziali non valide' } }, { status: 401, statusText: 'Unauthorized' });

    expect(outcome.errored).toBeTrue();
    expect(errorService.setError).toHaveBeenCalledWith({
      statusCode: 401,
      message: 'Credenziali non valide',
      details: [],
    });
    expect(authService.clearSession).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('su sessione scaduta pulisce la sessione e porta al login del cliente', () => {
    getFailingWith(401, { error: { message: 'Sessione scaduta' } });

    expect(authService.clearSession).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('su sessione scaduta di un admin porta al login admin', () => {
    authService.isAdmin.and.returnValue(true);

    getFailingWith(401, { error: { message: 'Sessione scaduta' } });

    expect(router.navigate).toHaveBeenCalledWith(['/admin/login']);
  });

  it('usa il messaggio di default quando il 401 non ne porta uno', () => {
    getFailingWith(401, {});

    expect(errorService.setError).toHaveBeenCalledWith({
      statusCode: 401,
      message: 'Credenziali errate',
      details: [],
    });
  });

  it('accetta anche un 401 il cui payload espone l errore come stringa', () => {
    getFailingWith(401, { error: 'Token non valido' });

    expect(errorService.setError).toHaveBeenCalledWith({
      statusCode: 401,
      message: 'Token non valido',
      details: [],
    });
  });

  // ─── 403 ────────────────────────────────────────────────────────────────────
  it('porta alla pagina forbidden un cliente senza permessi', () => {
    getFailingWith(403, { error: { message: 'Accesso negato' } });

    expect(errorService.setError).toHaveBeenCalledWith({ statusCode: 403, message: 'Accesso negato' });
    expect(router.navigate).toHaveBeenCalledWith(['/forbidden']);
  });

  it('lascia l admin sulla pagina corrente in caso di 403', () => {
    authService.isAdmin.and.returnValue(true);

    getFailingWith(403, { error: { message: 'Accesso negato' } });

    expect(errorService.setError).toHaveBeenCalledWith({ statusCode: 403, message: 'Accesso negato' });
    expect(router.navigate).not.toHaveBeenCalled();
  });

  // ─── 404, 422, 500 ──────────────────────────────────────────────────────────
  it('segnala una risorsa non trovata', () => {
    getFailingWith(404, { error: { message: 'Risorsa non trovata' } });

    expect(errorService.setError).toHaveBeenCalledWith({ statusCode: 404, message: 'Risorsa non trovata' });
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('espone i campi non validi di un 422', () => {
    getFailingWith(422, {
      error: { message: 'Validazione fallita', details: ['Title non può essere vuoto'] },
    });

    expect(errorService.setError).toHaveBeenCalledWith({
      statusCode: 422,
      message: 'Validazione fallita',
      details: ['Title non può essere vuoto'],
    });
  });

  it('segnala un errore interno del server', () => {
    getFailingWith(500, { error: { message: 'Si è verificato un errore imprevisto' } });

    expect(errorService.setError).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Si è verificato un errore imprevisto',
    });
  });

  // ─── Casi non previsti dalla tabella ────────────────────────────────────────
  it('inoltra uno status non gestito conservandone il codice', () => {
    getFailingWith(503, { error: { message: 'Servizio non disponibile' } });

    expect(errorService.setError).toHaveBeenCalledWith({
      statusCode: 503,
      message: 'Servizio non disponibile',
    });
  });

  it('ricade su un messaggio generico se il payload non ha la forma attesa', () => {
    getFailingWith(500, 'testo non json');

    expect(errorService.setError).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Si è verificato un errore imprevisto',
    });
  });
});
