import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { OrderService } from './order-service';
import { OrderResponse } from '../../models/order';

describe('OrderService', () => {
  let service: OrderService;
  let httpMock: HttpTestingController;

  const mockOrderResponse: OrderResponse = {
    pagy: {
      page: 1,
      count: 2,
      limit: 10,
      last: 1,
      from: 1,
      to: 2,
      prev: null,
      next: null,
    },
    orders: [
      {
        id: 1,
        customer_id: 1,
        shipping_name: 'Mario Rossi',
        shipping_street: 'Via Roma 1',
        shipping_city: 'Milano',
        shipping_zip: '20100',
        status: 'processing',
        total: 150.0,
        created_at: '2025-05-01T10:00:00Z',
        updated_at: '2025-05-01T10:00:00Z',
        order_items: []
      },
      {
        id: 2,
        customer_id: 1,
        shipping_name: 'Mario Rossi',
        shipping_street: 'Via Garibaldi 7',
        shipping_city: 'Torino',
        shipping_zip: '10100',
        status: 'completed',
        total: 89.99,
        created_at: '2025-05-10T12:00:00Z',
        updated_at: '2025-05-10T12:00:00Z',
        order_items: []
      }
    ]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        OrderService,
      ]
    });
    service = TestBed.inject(OrderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify(); // assicura che non ci siano richieste HTTP pendenti
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('list()', () => {
    it('should GET orders without any filter', () => {
      service.list({}).subscribe(response => {
        expect(response.pagy.count).toBe(2);
        expect(response.orders.length).toBe(2);
      });

      const req = httpMock.expectOne('/api/orders');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0); // nessun parametro
      req.flush(mockOrderResponse);
    });

    it('should pass active filters as query params', () => {
      service.list({
        min: 10,
        max: 100,
        status: 'completed',
        year: 2025,
        sort: 'total',
        page: 2,
        limit: 5
      }).subscribe();

      const req = httpMock.expectOne(
        '/api/orders?min=10&max=100&status=completed&year=2025&sort=total&page=2&limit=5'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockOrderResponse);
    });

    it('should omit null and undefined filters', () => {
      service.list({
        min: null,
        status: undefined,
        year: 2025,
        page: 1
      }).subscribe();

      const req = httpMock.expectOne('/api/orders?year=2025&page=1');
      expect(req.request.method).toBe('GET');
      req.flush(mockOrderResponse);
    });
  });
});
