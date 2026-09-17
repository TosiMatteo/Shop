import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { CartPageComponent } from './cart-page';
import { CartCardComponent } from '../cart-card/cart-card';
import { CartService } from '../../../core/services/cart/cart-service';
import { AuthService } from '../../../core/services/auth/auth-service';
import { Cart } from '../../../core/models/cart';

describe('CartPageComponent', () => {
  let component: CartPageComponent;
  let fixture: ComponentFixture<CartPageComponent>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let cart$: BehaviorSubject<Cart | null>;
  let navigateSpy: jasmine.Spy;

  const mockCart: Cart = { id: 1, customerId: 10, items: [], total_price: 0 };

  beforeEach(async () => {
    cart$ = new BehaviorSubject<Cart | null>(mockCart);
    const cartServiceMock = jasmine.createSpyObj<CartService>('CartService', [], {
      cart$: cart$.asObservable(),
    });
    authServiceMock = jasmine.createSpyObj<AuthService>('AuthService', ['isAuthenticated']);
    authServiceMock.isAuthenticated.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [CartPageComponent],
      providers: [
        provideRouter([]),
        { provide: CartService, useValue: cartServiceMock },
        { provide: AuthService, useValue: authServiceMock },
      ],
    })
      .overrideComponent(CartPageComponent, {
        remove: { imports: [CartCardComponent] },
        add: { schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(CartPageComponent);
    component = fixture.componentInstance;
    navigateSpy = spyOn(TestBed.inject(Router), 'navigate');
    fixture.detectChanges();
  });

  /** Legge il valore corrente di hasItems$. */
  function hasItems(): boolean {
    let value = false;
    component.hasItems$.subscribe(result => (value = result)).unsubscribe();
    return value;
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ─── hasItems$ ─────────────────────────────────────────────────────────────
  describe('hasItems$', () => {
    it('should be false for an empty cart', () => {
      expect(hasItems()).toBeFalse();
    });

    it('should be false when there is no cart', () => {
      cart$.next(null);

      expect(hasItems()).toBeFalse();
    });

    it('should be true when the cart has items', () => {
      cart$.next({ ...mockCart, items: [{ id: 1, cartId: 1, productId: 1, quantity: 1 } as any] });

      expect(hasItems()).toBeTrue();
    });
  });

  // ─── proceedToCheckout() ───────────────────────────────────────────────────
  describe('proceedToCheckout()', () => {
    it('should navigate to /checkout when the user is authenticated', () => {
      authServiceMock.isAuthenticated.and.returnValue(true);

      component.proceedToCheckout();

      expect(navigateSpy).toHaveBeenCalledOnceWith(['/checkout']);
    });

    it('should navigate to /login keeping the checkout as return url otherwise', () => {
      component.proceedToCheckout();

      expect(navigateSpy).toHaveBeenCalledOnceWith(['/login'], {
        queryParams: { returnUrl: '/checkout' },
      });
    });
  });
});
