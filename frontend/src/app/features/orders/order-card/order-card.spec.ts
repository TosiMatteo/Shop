import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrderCard } from './order-card';
import { Order } from '../../../core/models/order';

describe('OrderCard', () => {
  let component: OrderCard;
  let fixture: ComponentFixture<OrderCard>;
  let element: HTMLElement;

  const mockOrder: Order = {
    id: 1,
    customer_id: 101,
    shipping_name: 'Mario Rossi',
    shipping_street: 'Via Roma 1',
    shipping_city: 'Milano',
    shipping_zip: '20100',
    status: 'processing',
    total: 199.98,
    created_at: '2025-01-15T10:30:00Z',
    updated_at: '2025-01-15T10:30:00Z',
    order_items: [
      {
        id: 1,
        product_id: 1,
        quantity: 2,
        unit_price: 99.99,
        product: {
          id: 1,
          title: 'Prodotto di test',
          thumbnail_url: 'https://example.com/thumb.jpg',
        },
      },
    ],
  };

  function toggleButton(): HTMLButtonElement {
    return element.querySelector<HTMLButtonElement>('.order-card__toggle')!;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderCard],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderCard);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    fixture.componentRef.setInput('order', mockOrder);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ─── Rendering ─────────────────────────────────────────────────────────────
  it('should show the order number, shipping data and status label', () => {
    expect(element.textContent).toContain('Ordine #1');
    expect(element.textContent).toContain('Mario Rossi');
    expect(element.textContent).toContain('Via Roma 1, 20100 Milano');
    expect(element.textContent).toContain('In elaborazione');
  });

  it('should show the label of a completed order', () => {
    fixture.componentRef.setInput('order', { ...mockOrder, status: 'completed' });
    fixture.detectChanges();

    expect(element.textContent).toContain('Completato');
  });

  // ─── Dettagli ──────────────────────────────────────────────────────────────
  it('should start collapsed, showing the number of items', () => {
    expect(toggleButton().getAttribute('aria-expanded')).toBe('false');
    expect(toggleButton().textContent).toContain('Vedi dettagli (1)');
  });

  it('should expand and collapse the details on click', () => {
    toggleButton().click();
    fixture.detectChanges();

    expect(toggleButton().getAttribute('aria-expanded')).toBe('true');
    expect(element.querySelector('.order-card__items--open')).not.toBeNull();

    toggleButton().click();
    fixture.detectChanges();

    expect(toggleButton().getAttribute('aria-expanded')).toBe('false');
  });
});
