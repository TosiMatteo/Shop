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
import { CheckoutResponse } from '../../models/checkout';

describe('CartService', () => {
  let service: CartService;
  let httpMock: HttpTestingController;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let errorServiceMock: jasmine.SpyObj<ErrorService>;
  let loginEvent: Subject<void>;
  let logoutEvent: Subject<void>;

  const GUEST_CART_KEY = 'guest_cart';

  const mockProduct: Product = {
    id: '101',
    title: 'Test Product',
    description: '',
    price: 9.99,
    original_price: 12.99,
    sale: true,
    created_at: '2025-01-01',
  };

  const mockCartItem: CartItem = {
    id: 1,
    cartId: 1,
    productId: 101,
    quantity: 1,
    product: mockProduct,
  };

  const mockCart: Cart = {
    id: 1,
    customerId: 10,
    items: [mockCartItem],
    total_price: 9.99,
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
        CartService,
      ],
    });

    httpMock = TestBed.inject(HttpTestingController);
  }

  beforeEach(() => {
    authServiceMock = jasmine.createSpyObj<AuthService>('AuthService', [
      'isAuthenticated',
      'getCurrentUser',
    ]);
    errorServiceMock = jasmine.createSpyObj<ErrorService>('ErrorService', ['setError']);

    // Di default l'utente non è autenticato.
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

  // ─── Utente autenticato ────────────────────────────────────────────────────
  describe('authenticated user', () => {
    beforeEach(() => {
      // Utente autenticato con un carrello di partenza.
      authServiceMock.isAuthenticated.and.returnValue(true);
      (service as any).cartSubject.next(mockCart);
    });

    it('should add item (POST + refresh)', () => {
      service.addItem(mockProduct, 1);

      const postReq = httpMock.expectOne(`/api/carts/${mockCart.id}/cart_items`);
      expect(postReq.request.method).toBe('POST');
      postReq.flush(mockCartItem);

      httpMock
        .expectOne('/api/carts')
        .flush({ ...mockCart, items: [{ ...mockCartItem, quantity: 2 }], total_price: 19.98 });

      expect(currentCart()?.items[0].quantity).toBe(2);
    });

    it('should update item quantity (PATCH + refresh)', () => {
      service.updateItem(mockCartItem.id, 3);

      const patchReq = httpMock.expectOne(`/api/cart_items/${mockCartItem.id}`);
      expect(patchReq.request.method).toBe('PATCH');
      patchReq.flush({});

      httpMock
        .expectOne('/api/carts')
        .flush({ ...mockCart, items: [{ ...mockCartItem, quantity: 3 }], total_price: 29.97 });

      expect(currentCart()?.items[0].quantity).toBe(3);
      expect(currentCart()?.total_price).toBe(29.97);
    });

    it('should remove item when quantity < 1', () => {
      spyOn(service, 'removeItem');

      service.updateItem(mockCartItem.id, 0);

      expect(service.removeItem).toHaveBeenCalledWith(mockCartItem.id);
    });

    it('should remove item (DELETE + refresh)', () => {
      service.removeItem(mockCartItem.id);

      const deleteReq = httpMock.expectOne(`/api/cart_items/${mockCartItem.id}`);
      expect(deleteReq.request.method).toBe('DELETE');
      deleteReq.flush(null);

      httpMock.expectOne('/api/carts').flush({ ...mockCart, items: [], total_price: 0 });

      expect(currentCart()?.items).toEqual([]);
      expect(currentCart()?.total_price).toBe(0);
    });

    it('should checkout successfully', () => {
      const shipping = { name: 'Mario', street: 'Via Roma', city: 'Milano', zip: '20100' };
      const mockCheckoutResponse: CheckoutResponse = {
        id: 1,
        total: '9.99',
        status: 'processing',
        shipping_name: 'Mario',
        order_items: 1,
      };
      let response: CheckoutResponse | undefined;

      service.checkout(shipping).subscribe(result => (response = result));

      const postReq = httpMock.expectOne(`/api/carts/${mockCart.id}/checkout`);
      expect(postReq.request.method).toBe('POST');
      postReq.flush(mockCheckoutResponse);

      expect(response?.status).toBe('processing');
      expect(currentCart()).toBeNull();
    });

    it('should not checkout without active cart', () => {
      (service as any).cartSubject.next(null);

      service.checkout({ name: 'Test' } as any).subscribe({
        error: () => fail('should not error'),
      });

      expect(errorServiceMock.setError).toHaveBeenCalledWith({
        statusCode: 0,
        message: 'Nessun carrello attivo',
      });
    });

    // Guardia contro i click ripetuti.
    it('should ignore a second add while the first one is in flight', () => {
      service.addItem(mockProduct, 1);
      service.addItem(mockProduct, 1);

      const posts = httpMock.match(`/api/carts/${mockCart.id}/cart_items`);
      expect(posts.length).toBe(1);
      posts[0].flush(mockCartItem);

      httpMock.expectOne('/api/carts').flush(mockCart);
    });

    it('should accept a new add once the previous one has completed', () => {
      service.addItem(mockProduct, 1);
      httpMock.expectOne(`/api/carts/${mockCart.id}/cart_items`).flush(mockCartItem);
      httpMock.expectOne('/api/carts').flush(mockCart);

      service.addItem(mockProduct, 2);

      const secondPost = httpMock.expectOne(`/api/carts/${mockCart.id}/cart_items`);
      expect(secondPost.request.body).toEqual({ cart_item: { product_id: '101', quantity: 2 } });
      secondPost.flush(mockCartItem);

      httpMock.expectOne('/api/carts').flush(mockCart);
    });

    it('should load the cart from the server when its id is not known yet', () => {
      (service as any).cartSubject.next(null);

      service.addItem(mockProduct, 1);

      // Prima il carrello viene caricato, poi si aggiunge la riga.
      const load = httpMock.expectOne('/api/carts');
      expect(load.request.method).toBe('GET');
      load.flush(mockCart);

      const post = httpMock.expectOne(`/api/carts/${mockCart.id}/cart_items`);
      expect(post.request.method).toBe('POST');
      post.flush(mockCartItem);

      httpMock.expectOne('/api/carts').flush(mockCart);
    });

    it('should reset the cart when the user logs out', () => {
      logoutEvent.next();

      expect(currentCart()).toBeNull();
    });
  });

  // ─── Carrello ospite: nessuna chiamata HTTP, tutto su localStorage ─────────
  describe('guest user', () => {
    it('should add a product to the local cart', () => {
      service.addItem(mockProduct, 1);

      expect(guestItems()).toEqual([{ productId: 101, quantity: 1, product: mockProduct }]);
      expect(currentCart()?.items.length).toBe(1);
      expect(currentCart()?.total_price).toBeCloseTo(9.99, 2);
    });

    it('should sum quantities instead of duplicating the line', () => {
      service.addItem(mockProduct, 1);
      service.addItem(mockProduct, 2);

      expect(guestItems().length).toBe(1);
      expect(guestItems()[0].quantity).toBe(3);
      expect(currentCart()?.total_price).toBeCloseTo(29.97, 2);
    });

    it('should update the quantity of a local line', () => {
      service.addItem(mockProduct, 1);

      service.updateItem(101, 5);

      expect(guestItems()[0].quantity).toBe(5);
      expect(currentCart()?.total_price).toBeCloseTo(49.95, 2);
    });

    it('should remove a local line', () => {
      service.addItem(mockProduct, 1);

      service.removeItem(101);

      expect(guestItems()).toEqual([]);
      expect(currentCart()?.items.length).toBe(0);
    });

    it('should remove the line when updateItem receives a zero quantity', () => {
      service.addItem(mockProduct, 1);

      service.updateItem(101, 0);

      expect(guestItems()).toEqual([]);
    });

    it('should ignore a corrupted guest cart in localStorage', () => {
      localStorage.setItem(GUEST_CART_KEY, 'non-è-json');

      service.addItem(mockProduct, 1);

      expect(guestItems()).toEqual([{ productId: 101, quantity: 1, product: mockProduct }]);
    });

    it('should expose an empty cart when localStorage is empty', () => {
      expect(currentCart()?.items).toEqual([]);
      expect(currentCart()?.total_price).toBe(0);
    });
  });

  // ─── Fusione del carrello ospite al login ──────────────────────────────────
  describe('syncGuestCart', () => {
    it('should send every guest item and then clear localStorage', () => {
      localStorage.setItem(
        GUEST_CART_KEY,
        JSON.stringify([{ productId: 101, quantity: 2, product: mockProduct }]),
      );

      service.syncGuestCart().subscribe();

      httpMock.expectOne('/api/carts').flush(mockCart);

      const postReq = httpMock.expectOne(`/api/carts/${mockCart.id}/cart_items`);
      expect(postReq.request.body).toEqual({ cart_item: { product_id: 101, quantity: 2 } });
      postReq.flush(mockCartItem);

      httpMock.expectOne('/api/carts').flush(mockCart);

      expect(localStorage.getItem(GUEST_CART_KEY)).toBeNull();
    });

    it('should send nothing when the guest cart is empty', () => {
      service.syncGuestCart().subscribe();

      // Solo il caricamento del carrello server: nessuna POST.
      httpMock.expectOne('/api/carts').flush(mockCart);

      expect(localStorage.getItem(GUEST_CART_KEY)).toBeNull();
    });

    it('should complete the merge even if the server rejects an item', () => {
      const secondProduct = { ...mockProduct, id: '102' };
      localStorage.setItem(
        GUEST_CART_KEY,
        JSON.stringify([
          { productId: 101, quantity: 1, product: mockProduct },
          { productId: 102, quantity: 1, product: secondProduct },
        ]),
      );
      let completed = false;

      service.syncGuestCart().subscribe({ complete: () => (completed = true) });

      httpMock.expectOne('/api/carts').flush(mockCart);

      const posts = httpMock.match(`/api/carts/${mockCart.id}/cart_items`);
      expect(posts.length).toBe(2);
      posts[0].flush(null, { status: 422, statusText: 'Unprocessable Content' });
      posts[1].flush(mockCartItem);

      httpMock.expectOne('/api/carts').flush(mockCart);

      expect(completed).toBeTrue();
      expect(localStorage.getItem(GUEST_CART_KEY)).toBeNull();
    });

    it('should start on its own when AuthService reports a login', () => {
      localStorage.setItem(
        GUEST_CART_KEY,
        JSON.stringify([{ productId: 101, quantity: 1, product: mockProduct }]),
      );

      loginEvent.next();

      httpMock.expectOne('/api/carts').flush(mockCart);
      httpMock.expectOne(`/api/carts/${mockCart.id}/cart_items`).flush(mockCartItem);
      httpMock.expectOne('/api/carts').flush(mockCart);

      expect(localStorage.getItem(GUEST_CART_KEY)).toBeNull();
    });
  });

  // ─── Avvio con utente già autenticato ──────────────────────────────────────
  // Il carrello viene caricato nel costruttore, quindi il servizio va creato
  // dopo aver dichiarato l'utente autenticato: da qui il reset del TestBed.
  describe('startup with an authenticated user', () => {
    beforeEach(() => {
      TestBed.resetTestingModule();
      authServiceMock.isAuthenticated.and.returnValue(true);
      configureTestBed();
      service = TestBed.inject(CartService);
    });

    it('should load the existing cart and leave the loading state', () => {
      let loading = true;
      service.isLoading$.subscribe(value => (loading = value));

      httpMock.expectOne('/api/carts').flush(mockCart);

      expect(currentCart()?.id).toBe(mockCart.id);
      expect(loading).toBeFalse();
    });

    it('should normalize a cart without items to an empty list', () => {
      httpMock.expectOne('/api/carts').flush({ id: 1, customerId: 10, total_price: 0 });

      expect(currentCart()?.items).toEqual([]);
    });

    it('should create a server cart when the backend has none', () => {
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
