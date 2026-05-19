import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrderCard } from './order-card';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

describe('OrderCard', () => {
  let component: OrderCard;
  let fixture: ComponentFixture<OrderCard>;

  const mockOrder = {
    id: 1,
    customer_id: 101,
    shipping_name: 'Mario Rossi',
    shipping_street: 'Via Roma 1',
    shipping_city: 'Milano',
    shipping_zip: '20100',
    status: 'processing' as const,
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
          thumbnail_url: 'https://example.com/thumb.jpg'
        }
      }
    ]
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderCard],
      providers: [
        provideRouter([]),
        provideHttpClient(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OrderCard);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('order', mockOrder);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
