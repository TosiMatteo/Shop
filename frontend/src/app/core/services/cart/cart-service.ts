import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {BehaviorSubject, catchError, forkJoin, map, Observable, of, switchMap, tap, throwError} from 'rxjs';
import { AuthService } from '../auth/auth-service';
import { Cart } from '../../models/cart';
import { CartItem } from '../../models/cart-item';
import { Product } from '../../models/product';
import { CheckoutResponse, ShippingParams } from '../../models/checkout';


interface GuestItem {
  productId: number;
  quantity: number;
  product: Product;
}

interface MeResponse {
  user: { id: number };
}

const GUEST_CART_KEY = 'guest_cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  private cartSubject = new BehaviorSubject<Cart | null>(null);
  readonly cart$ = this.cartSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(this.auth.isAuthenticated());
  readonly isLoading$ = this.loadingSubject.asObservable();

  constructor() {
    if (this.auth.isAuthenticated()) {
      this.loadServerCart().subscribe();
    } else {
      this.cartSubject.next(this.buildGuestCart());
    }
  }

  // ─── Guest cart helpers ──────────────────────────────────────────────────────

  private getGuestItems(): GuestItem[] {
    try {
      return JSON.parse(localStorage.getItem(GUEST_CART_KEY) ?? '[]');
    } catch {
      return [];
    }
  }

  private saveGuestItems(items: GuestItem[]): void {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
    this.cartSubject.next(this.buildGuestCart());
  }

  private buildGuestCart(): Cart {
    const items = this.getGuestItems();
    return {
      id: 0,
      customerId: 0,
      items: items.map(g => ({
        id: g.productId,
        cartId: 0,
        productId: g.productId,
        quantity: g.quantity,
        product: g.product,
      })),
      total_price: items.reduce((sum, g) => sum + g.product.price * g.quantity, 0),
    };
  }

  // ─── Server cart helpers ─────────────────────────────────────────────────────

  private loadServerCart(): Observable<Cart> {
    return this.http.get<Cart | null>('/api/carts').pipe(
      switchMap(cart => (cart ? of(cart) : this.createServerCart())),
      tap(cart => {
        this.cartSubject.next(cart);
        this.loadingSubject.next(false);
      }),
    );
  }

  private createServerCart(): Observable<Cart> {
    return (this.auth.getCurrentUser() as Observable<MeResponse>).pipe(
      switchMap(res =>
        this.http.post<Cart>('/api/carts', { cart: { customer_id: res.user.id } }),
      ),
    );
  }

  // ─── Public API ──────────────────────────────────────────────────────────────
  private pendingAdd = false;
  addItem(product: Product, quantity = 1): void {
    if (this.auth.isAuthenticated()) {
      if (this.pendingAdd) return;
      this.pendingAdd = true;

      const addToServer = (cartId: number) =>
        this.http
          .post<CartItem>(`/api/carts/${cartId}/cart_items`, {
            cart_item: { product_id: product.id, quantity },
          })
          .pipe(switchMap(() => this.loadServerCart()));

      const cartId = this.cartSubject.value?.id;
      const add$ = cartId
        ? addToServer(cartId)
        : this.loadServerCart().pipe(switchMap(cart => addToServer(cart.id)));

      add$.subscribe({
        complete: () => (this.pendingAdd = false),
        error: () => (this.pendingAdd = false),
      });
    } else {
      const items = this.getGuestItems();
      const existing = items.find(i => i.productId === +product.id);
      if (existing) {
        existing.quantity += quantity;
      } else {
        items.push({ productId: +product.id, quantity, product });
      }
      this.saveGuestItems(items);
    }
  }

  updateItem(cartItemId: number, quantity: number): void {
    if (quantity < 1) {
      this.removeItem(cartItemId);
      return;
    }
    if (this.auth.isAuthenticated()) {
      this.http
        .patch(`/api/cart_items/${cartItemId}`, { cart_item: { quantity } })
        .pipe(switchMap(() => this.loadServerCart()))
        .subscribe();
    } else {
      const items = this.getGuestItems();
      const item = items.find(i => i.productId === cartItemId);
      if (item) {
        item.quantity = quantity;
        this.saveGuestItems(items);
      }
    }
  }

  removeItem(cartItemId: number): void {
    if (this.auth.isAuthenticated()) {
      this.http
        .delete(`/api/cart_items/${cartItemId}`)
        .pipe(switchMap(() => this.loadServerCart()))
        .subscribe();
    } else {
      const items = this.getGuestItems().filter(i => i.productId !== cartItemId);
      this.saveGuestItems(items);
    }
  }

  checkout(shipping: ShippingParams): Observable<CheckoutResponse> {
    const cartId = this.cartSubject.value?.id;
    if (!cartId) return throwError(() => new Error('Nessun carrello attivo'));
    return this.http
      .post<CheckoutResponse>(`/api/carts/${cartId}/checkout`, { shipping })
      .pipe(
        tap(() => this.cartSubject.next(null)),
      );
  }

  syncGuestCart(): Observable<void> {
    const guestItems = this.getGuestItems();
    return this.loadServerCart().pipe(
      switchMap(cart => {
        if (guestItems.length === 0) return of(undefined);
        return forkJoin(
          guestItems.map(g =>
            this.http
              .post<CartItem>(`/api/carts/${cart.id}/cart_items`, {
                cart_item: { product_id: g.productId, quantity: g.quantity },
              })
              .pipe(catchError(() => of(null))),
          ),
        ).pipe(
          switchMap(() => this.loadServerCart()),
          map(() => undefined),
        );
      }),
      tap(() => localStorage.removeItem(GUEST_CART_KEY)),
    );
  }
}
