import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProductApi } from './product-service';
import { Product, ProductsResponse } from '../../models/product';

describe('ProductApi', () => {
  let service: ProductApi;
  let httpMock: HttpTestingController;

  // Prodotto in saldo
  const productOnSale: Product = {
    id: '1',
    title: 'Prodotto in offerta',
    description: 'Sconto del 25%',
    price: 19.99,
    original_price: 29.99,
    sale: true,
    tags: ['offerte'],
    created_at: '2025-01-02T00:00:00Z',
  };

  const mockProductsResponse: ProductsResponse = {
    pagy: {
      page: 1,
      count: 1,
      limit: 20,
      last: 1,
      from: 1,
      to: 1,
      prev: null,
      next: null,
    },
    products: [productOnSale],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ProductApi,
      ],
    });

    service = TestBed.inject(ProductApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Verifica che non ci siano richieste HTTP pendenti
    httpMock.verify();
  });

  // Test di esistenza del servizio
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('list()', () => {
    // Recupero prodotti senza filtri
    it('should GET products without filters', () => {
      service.list({}).subscribe(response => {
        expect(response.pagy.page).toBe(1);
        expect(response.products.length).toBe(1);
        const product = response.products[0];
        expect(product.sale).toBeTrue();
        expect(product.price).toBe(19.99);
        expect(product.original_price).toBe(29.99);
      });

      const req = httpMock.expectOne('/api/products');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockProductsResponse);
    });

    // Tutti i filtri attivi diventano query params
    it('should pass all active filters as query params', () => {
      const filters = {
        tag: 'offerte',
        title: 'test',
        min: 5,
        max: 50,
        sale: true,
        sort: 'price',
        page: 2,
        limit: 10,
      };

      service.list(filters).subscribe();

      const req = httpMock.expectOne(
        '/api/products?tag=offerte&title=test&min=5&max=50&sale=true&sort=price&page=2&limit=10'
      );
      expect(req.request.method).toBe('GET');
      req.flush({ pagy: {}, products: [] });
    });

    // Filtri null o vuoti vengono ignorati
    it('should exclude null/empty filters', () => {
      service.list({ tag: null, min: 10, sale: null, page: 1 }).subscribe();

      const req = httpMock.expectOne('/api/products?min=10&page=1');
      expect(req.request.method).toBe('GET');
      req.flush(mockProductsResponse);
    });

    // Prezzi ricevuti come stringhe vengono convertiti in numeri
    it('should convert price and original_price to numbers', () => {
      const stringPriceResponse = {
        pagy: mockProductsResponse.pagy,
        products: [
          { ...productOnSale, price: '19.99', original_price: '29.99' },
        ],
      };

      service.list({}).subscribe(response => {
        expect(response.products[0].price).toBe(19.99);
        expect(response.products[0].original_price).toBe(29.99);
      });

      httpMock.expectOne('/api/products').flush(stringPriceResponse);
    });
  });

  describe('create()', () => {
    // Creazione prodotto con FormData via POST
    it('should POST with FormData', () => {
      const formData = new FormData();
      formData.append('title', 'New Product');

      service.create(formData).subscribe(response => {
        expect(response).toEqual({ id: '2' });
      });

      const req = httpMock.expectOne('/api/products');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(formData);
      req.flush({ id: '2' });
    });
  });

  describe('update()', () => {
    // Aggiornamento prodotto tramite PATCH con FormData
    it('should PATCH product by id with FormData', () => {
      const formData = new FormData();
      formData.append('title', 'Updated');

      service.update('1', formData).subscribe(product => {
        expect(product.title).toBe('Updated');
      });

      const req = httpMock.expectOne('/api/products/1');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(formData);
      req.flush({ ...productOnSale, title: 'Updated' });
    });
  });

  describe('delete()', () => {
    // Cancellazione prodotto tramite DELETE
    it('should DELETE product by id', () => {
      service.delete('1').subscribe(response => {
        expect(response).toBeNull();
      });

      const req = httpMock.expectOne('/api/products/1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });
});
