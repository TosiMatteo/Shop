import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { CartCardComponent } from './cart-card';
import { CartService } from '../../../core/services/cart/cart-service';
import { Cart } from '../../../core/models/cart';
import { CartItem } from '../../../core/models/cart-item';

describe('CartCardComponent', () => {
  let component: CartCardComponent;
  let fixture: ComponentFixture<CartCardComponent>;
  let element: HTMLElement;
  let cartServiceMock: jasmine.SpyObj<CartService>;
  let cart$: BehaviorSubject<Cart | null>;

  const mockCartItem: CartItem = {
    id: 1,
    cartId: 1,
    productId: 101,
    quantity: 2,
    product: {
      id: '101',
      title: 'Prodotto di test',
      description: '',
      price: 10,
      original_price: 10,
      sale: false,
      created_at: '2025-01-01',
    },
  };

  const mockCart: Cart = { id: 1, customerId: 10, items: [mockCartItem], total_price: 20 };

  beforeEach(async () => {
    cart$ = new BehaviorSubject<Cart | null>(mockCart);
    cartServiceMock = jasmine.createSpyObj<CartService>(
      'CartService',
      ['updateItem', 'removeItem'],
      { cart$: cart$.asObservable(), isLoading$: of(false) },
    );

    await TestBed.configureTestingModule({
      imports: [CartCardComponent],
      providers: [{ provide: CartService, useValue: cartServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(CartCardComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ─── Rendering ─────────────────────────────────────────────────────────────
  it('should list the cart items with their quantity controls', () => {
    expect(element.textContent).toContain('Prodotto di test');
    expect(element.querySelector('.quantity-value')?.textContent).toContain('2');
  });

  it('should hide the quantity controls when readonly', () => {
    fixture.componentRef.setInput('readonly', true);
    fixture.detectChanges();

    expect(element.querySelector('.quantity-controls')).toBeNull();
  });

  it('should show the empty state when the cart has no items', () => {
    cart$.next({ ...mockCart, items: [], total_price: 0 });
    fixture.detectChanges();

    expect(element.querySelector('.empty-cart')?.textContent).toContain('Il carrello è vuoto');
  });

  // ─── Azioni ────────────────────────────────────────────────────────────────
  it('should increase the quantity by one', () => {
    component.increment(mockCartItem);

    expect(cartServiceMock.updateItem).toHaveBeenCalledOnceWith(mockCartItem.id, 3);
  });

  it('should decrease the quantity by one', () => {
    component.decrement(mockCartItem);

    expect(cartServiceMock.updateItem).toHaveBeenCalledOnceWith(mockCartItem.id, 1);
  });

  it('should remove the item', () => {
    component.remove(mockCartItem);

    expect(cartServiceMock.removeItem).toHaveBeenCalledOnceWith(mockCartItem.id);
  });
});
