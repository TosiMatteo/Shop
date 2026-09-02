import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of, Subject } from 'rxjs';
import { CartService } from './cart-service';
import { AuthService } from '../auth/auth-service';
import { ErrorService } from '../error-service';
import { Cart } from '../../models/cart';
import { Product } from '../../models/product';
import { CartItem } from '../../models/cart-item';

describe('CartService', () => {
  let service: CartService;
  let httpMock: HttpTestingController;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let errorServiceMock: jasmine.SpyObj<ErrorService>;
  let loginEvent: Subject<void>;
  let logoutEvent: Subject<void>;

  const GUEST_CART_KEY = 'guest_cart';

  const product: Product = {
    id: '101',
    title: 'Test Product',
    description: '',
    price: 9.99,
    original_price: 12.99,
    sale: true,
    created_at: '2025-01-01'
  };

  const cartItem: CartItem = {
    id: 1,
    cartId: 1,
    productId: 101,
    quantity: 1,
    product
  };

  const mockCart: Cart = {
    id: 1,
    customerId: 10,
    items: [cartItem],
    total_price: 9.99
  };

  /** Legge il valore corrente del BehaviorSubject senza restare sottoscritti. */
  function currentCart(): Cart | null {
    let value: Cart | null = null;
    service.cart$.subscribe(cart => (value = cart)).unsubscribe();
    return value;
  }

  /** Legge il carrello ospite serializzato in localStorage. */
  function guestItems(): Array<{ productId: number; quantity: number; product: Product }> {
    return JSON.parse(localStorage.getItem(GUEST_CART_KEY) ?? '[]');
  }

  function configureTestBed(): void {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceMock },
        { provide: ErrorService, useValue: errorServiceMock },
        CartService
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
  }

  beforeEach(() => {
    authServiceMock = jasmine.createSpyObj<AuthService>('AuthService', [
      'isAuthenticated', 'getCurrentUser'
    ]);
    errorServiceMock = jasmine.createSpyObj<ErrorService>('ErrorService', ['setError']);

    // Di default, utente NON autenticato
    authServiceMock.isAuthenticated.and.returnValue(false);

    // Assegnazione forzata per le proprietà readonly. Sono Subject e non `of()`
    // così i test possono emettere login/logout a comando.
    loginEvent = new Subject<void>();
    logoutEvent = new Subject<void>();
    (authServiceMock as any).loginEvent$ = loginEvent.asObservable();
    (authServiceMock as any).logoutEvent$ = logoutEvent.asObservable();

    configureTestBed();
    service = TestBed.inject(CartService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('authenticated user', () => {
    beforeEach(() => {
      // Simula utente autenticato e setta un carrello di partenza
      authServiceMock.isAuthenticated.and.returnValue(true);
      (service as any).cartSubject.next(mockCart);
    });

    it('should add item (POST + refresh)', () => {
      service.addItem(product, 1);

      const postReq = httpMock.expectOne(`/api/carts/${mockCart.id}/cart_items`);
      expect(postReq.request.method).toBe('POST');
      postReq.flush(cartItem);

      const getReq = httpMock.expectOne('/api/carts');
      getReq.flush({ ...mockCart, items: [{ ...cartItem, quantity: 2 }], total_price: 19.98 });

      service.cart$.subscribe(cart => {
        expect(cart?.items[0].quantity).toBe(2);
      });
    });

    it('should update item quantity (PATCH + refresh)', () => {
      service.updateItem(cartItem.id, 3);

      const patchReq = httpMock.expectOne(`/api/cart_items/${cartItem.id}`);
      expect(patchReq.request.method).toBe('PATCH');
      patchReq.flush({});

      const getReq = httpMock.expectOne('/api/carts');
      getReq.flush({ ...mockCart, items: [{ ...cartItem, quantity: 3 }], total_price: 29.97 });
    });

    it('should remove item when quantity < 1', () => {
      spyOn(service, 'removeItem');
      service.updateItem(cartItem.id, 0);
      expect(service.removeItem).toHaveBeenCalledWith(cartItem.id);
    });

    it('should remove item (DELETE + refresh)', () => {
      service.removeItem(cartItem.id);

      const deleteReq = httpMock.expectOne(`/api/cart_items/${cartItem.id}`);
      expect(deleteReq.request.method).toBe('DELETE');
      deleteReq.flush(null);

      const getReq = httpMock.expectOne('/api/carts');
      const emptyCart = { ...mockCart, items: [], total_price: 0 };
      getReq.flush(emptyCart);
    });

    it('should checkout successfully', () => {
      const shipping = { name: 'Mario', street: 'Via Roma', city: 'Milano', zip: '20100' };
      service.checkout(shipping).subscribe(response => {
        expect(response.status).toBe('confirmed');
      });

      const postReq = httpMock.expectOne(`/api/carts/${mockCart.id}/checkout`);
      expect(postReq.request.method).toBe('POST');
      postReq.flush({ id: 1, total: '9.99', status: 'confirmed', shipping_name: 'Mario', order_items: 1 });

      service.cart$.subscribe(cart => expect(cart).toBeNull());
    });

    it('should not checkout without active cart', () => {
      (service as any).cartSubject.next(null);
      service.checkout({ name: 'Test' } as any).subscribe({
        error: () => fail('should not error')
      });
      expect(errorServiceMock.setError).toHaveBeenCalledWith({
        statusCode: 0,
        message: 'Nessun carrello attivo'
      });
    });

    // ─── Guardia contro i click ripetuti ──────────────────────────────────────
    it('ignora una seconda aggiunta mentre la prima è ancora in volo', () => {
      service.addItem(product, 1);
      service.addItem(product, 1);

      const posts = httpMock.match(`/api/carts/${mockCart.id}/cart_items`);
      expect(posts.length).toBe(1);
      posts[0].flush(cartItem);

      httpMock.expectOne('/api/carts').flush(mockCart);
    });

    it('accetta una nuova aggiunta dopo il completamento della precedente', () => {
      service.addItem(product, 1);
      httpMock.expectOne(`/api/carts/${mockCart.id}/cart_items`).flush(cartItem);
      httpMock.expectOne('/api/carts').flush(mockCart);

      service.addItem(product, 2);

      const secondPost = httpMock.expectOne(`/api/carts/${mockCart.id}/cart_items`);
      expect(secondPost.request.body).toEqual({ cart_item: { product_id: '101', quantity: 2 } });
      secondPost.flush(cartItem);

      httpMock.expectOne('/api/carts').flush(mockCart);
    });

    it('carica il carrello dal server se non ne conosce ancora l id', () => {
      (service as any).cartSubject.next(null);

      service.addItem(product, 1);

      // Prima il carrello viene caricato, poi si aggiunge la riga.
      const load = httpMock.expectOne('/api/carts');
      expect(load.request.method).toBe('GET');
      load.flush(mockCart);

      const post = httpMock.expectOne(`/api/carts/${mockCart.id}/cart_items`);
      expect(post.request.method).toBe('POST');
      post.flush(cartItem);

      httpMock.expectOne('/api/carts').flush(mockCart);
    });

    it('azzera il carrello quando l utente esce', () => {
      logoutEvent.next();

      expect(currentCart()).toBeNull();
    });
  });

  // ─── Carrello ospite: nessuna chiamata HTTP, tutto su localStorage ──────────
  describe('guest user', () => {
    it('aggiunge un prodotto al carrello locale', () => {
      service.addItem(product, 1);

      expect(guestItems()).toEqual([{ productId: 101, quantity: 1, product }]);
      expect(currentCart()?.items.length).toBe(1);
      expect(currentCart()?.total_price).toBeCloseTo(9.99, 2);
    });

    it('somma le quantità invece di duplicare la riga', () => {
      service.addItem(product, 1);
      service.addItem(product, 2);

      expect(guestItems().length).toBe(1);
      expect(guestItems()[0].quantity).toBe(3);
      expect(currentCart()?.total_price).toBeCloseTo(29.97, 2);
    });

    it('aggiorna la quantità di una riga locale', () => {
      service.addItem(product, 1);

      service.updateItem(101, 5);

      expect(guestItems()[0].quantity).toBe(5);
      expect(currentCart()?.total_price).toBeCloseTo(49.95, 2);
    });

    it('rimuove una riga locale', () => {
      service.addItem(product, 1);

      service.removeItem(101);

      expect(guestItems()).toEqual([]);
      expect(currentCart()?.items.length).toBe(0);
    });

    it('rimuove la riga anche passando da updateItem con quantità nulla', () => {
      service.addItem(product, 1);

      service.updateItem(101, 0);

      expect(guestItems()).toEqual([]);
    });

    it('ignora un carrello ospite corrotto in localStorage', () => {
      localStorage.setItem(GUEST_CART_KEY, 'non-è-json');

      service.addItem(product, 1);

      expect(guestItems()).toEqual([{ productId: 101, quantity: 1, product }]);
    });

    it('espone un carrello vuoto quando localStorage non contiene nulla', () => {
      expect(currentCart()?.items).toEqual([]);
      expect(currentCart()?.total_price).toBe(0);
    });
  });

  // ─── Fusione del carrello ospite al login ──────────────────────────────────
  describe('syncGuestCart', () => {
    it('invia ogni articolo ospite e poi svuota localStorage', () => {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify([{ productId: 101, quantity: 2, product }]));

      service.syncGuestCart().subscribe();

      httpMock.expectOne('/api/carts').flush(mockCart);

      const postReq = httpMock.expectOne(`/api/carts/${mockCart.id}/cart_items`);
      expect(postReq.request.body).toEqual({ cart_item: { product_id: 101, quantity: 2 } });
      postReq.flush(cartItem);

      httpMock.expectOne('/api/carts').flush(mockCart);

      expect(localStorage.getItem(GUEST_CART_KEY)).toBeNull();
    });

    it('non invia nulla se il carrello ospite è vuoto', () => {
      service.syncGuestCart().subscribe();

      // Solo il caricamento del carrello server: nessuna POST.
      httpMock.expectOne('/api/carts').flush(mockCart);

      expect(localStorage.getItem(GUEST_CART_KEY)).toBeNull();
    });

    it('completa la fusione anche se un articolo viene rifiutato dal server', () => {
      const second = { ...product, id: '102' };
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify([
        { productId: 101, quantity: 1, product },
        { productId: 102, quantity: 1, product: second }
      ]));

      let completed = false;
      service.syncGuestCart().subscribe({ complete: () => (completed = true) });

      httpMock.expectOne('/api/carts').flush(mockCart);

      const posts = httpMock.match(`/api/carts/${mockCart.id}/cart_items`);
      expect(posts.length).toBe(2);
      posts[0].flush(null, { status: 422, statusText: 'Unprocessable Content' });
      posts[1].flush(cartItem);

      httpMock.expectOne('/api/carts').flush(mockCart);

      expect(completed).toBeTrue();
      expect(localStorage.getItem(GUEST_CART_KEY)).toBeNull();
    });

    it('si attiva da sé quando AuthService segnala un login', () => {
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify([{ productId: 101, quantity: 1, product }]));

      loginEvent.next();

      httpMock.expectOne('/api/carts').flush(mockCart);
      httpMock.expectOne(`/api/carts/${mockCart.id}/cart_items`).flush(cartItem);
      httpMock.expectOne('/api/carts').flush(mockCart);

      expect(localStorage.getItem(GUEST_CART_KEY)).toBeNull();
    });
  });

  // ─── Avvio con utente già autenticato ──────────────────────────────────────
  // Il carrello viene caricato nel costruttore, quindi il servizio va creato
  // dopo aver dichiarato l'utente autenticato: da qui il reset del TestBed.
  describe('avvio con utente autenticato', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      authServiceMock.isAuthenticated.and.returnValue(true);
      configureTestBed();
      service = TestBed.inject(CartService);
    });

    it('carica il carrello esistente e esce dallo stato di caricamento', () => {
      let loading = true;
      service.isLoading$.subscribe(value => (loading = value));

      httpMock.expectOne('/api/carts').flush(mockCart);

      expect(currentCart()?.id).toBe(mockCart.id);
      expect(loading).toBeFalse();
    });

    it('normalizza a lista vuota un carrello senza items', () => {
      httpMock.expectOne('/api/carts').flush({ id: 1, customerId: 10, total_price: 0 });

      expect(currentCart()?.items).toEqual([]);
    });

    it('crea un carrello lato server quando il backend non ne ha uno', () => {
      authServiceMock.getCurrentUser.and.returnValue(of({ user: { id: 10 } }));

      httpMock.expectOne('/api/carts').flush(null);

      const postReq = httpMock.expectOne('/api/carts');
      expect(postReq.request.method).toBe('POST');
      expect(postReq.request.body).toEqual({ cart: { customer_id: 10 } });
      postReq.flush(mockCart);

      expect(currentCart()?.id).toBe(mockCart.id);
    });
  });
});
