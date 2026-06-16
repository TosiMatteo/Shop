import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
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

  beforeEach(() => {
    authServiceMock = jasmine.createSpyObj<AuthService>('AuthService', [
      'isAuthenticated', 'getCurrentUser'
    ]);
    errorServiceMock = jasmine.createSpyObj<ErrorService>('ErrorService', ['setError']);

    // Di default, utente NON autenticato
    authServiceMock.isAuthenticated.and.returnValue(false);

    // Assegnazione forzata per le proprietà readonly
    (authServiceMock as any).loginEvent$ = of();
    (authServiceMock as any).logoutEvent$ = of();

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
  });
});
