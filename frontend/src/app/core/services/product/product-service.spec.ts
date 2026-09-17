import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProductApi } from './product-service';
import { Product, ProductsResponse } from '../../models/product';

describe('ProductApi', () => {
  let service: ProductApi;
  let httpMock: HttpTestingController;

  const mockProduct: Product = {
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
    pagy: { page: 1, count: 1, limit: 20, last: 1, from: 1, to: 1, prev: null, next: null },
    products: [mockProduct],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ProductApi],
    });
    service = TestBed.inject(ProductApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── list() ────────────────────────────────────────────────────────────────
  describe('list()', () => {
    it('should GET products without filters', () => {
      let response: ProductsResponse | undefined;

      service.list({}).subscribe(result => (response = result));

      const req = httpMock.expectOne('/api/products');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockProductsResponse);

      expect(response?.pagy.page).toBe(1);
      expect(response?.products.length).toBe(1);
      expect(response?.products[0].sale).toBeTrue();
      expect(response?.products[0].price).toBe(19.99);
      expect(response?.products[0].original_price).toBe(29.99);
    });

    it('should pass all active filters as query params', () => {
      service
        .list({
          tag: 'offerte',
          title: 'test',
          min: 5,
          max: 50,
          sale: true,
          sort: 'price',
          page: 2,
          limit: 10,
        })
        .subscribe();

      const req = httpMock.expectOne(
        '/api/products?tag=offerte&title=test&min=5&max=50&sale=true&sort=price&page=2&limit=10',
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockProductsResponse);
    });

    it('should exclude null/empty filters', () => {
      service.list({ tag: null, min: 10, sale: null, page: 1 }).subscribe();

      const req = httpMock.expectOne('/api/products?min=10&page=1');
      expect(req.request.method).toBe('GET');
      req.flush(mockProductsResponse);
    });

    // Il backend serializza i decimali come stringhe.
    it('should convert price and original_price to numbers', () => {
      let response: ProductsResponse | undefined;

      service.list({}).subscribe(result => (response = result));

      httpMock.expectOne('/api/products').flush({
        pagy: mockProductsResponse.pagy,
        products: [{ ...mockProduct, price: '19.99', original_price: '29.99' }],
      });

      expect(response?.products[0].price).toBe(19.99);
      expect(response?.products[0].original_price).toBe(29.99);
    });
  });

  // ─── create() ──────────────────────────────────────────────────────────────
  describe('create()', () => {
    it('should POST with FormData', () => {
      const formData = new FormData();
      formData.append('title', 'New Product');
      let response: unknown;

      service.create(formData).subscribe(result => (response = result));

      const req = httpMock.expectOne('/api/products');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(formData);
      req.flush({ id: '2' });

      expect(response).toEqual({ id: '2' });
    });
  });

  // ─── update() ──────────────────────────────────────────────────────────────
  describe('update()', () => {
    it('should PATCH product by id with FormData', () => {
      const formData = new FormData();
      formData.append('title', 'Updated');
      let product: Product | undefined;

      service.update('1', formData).subscribe(result => (product = result));

      const req = httpMock.expectOne('/api/products/1');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(formData);
      req.flush({ ...mockProduct, title: 'Updated' });

      expect(product?.title).toBe('Updated');
    });
  });

  // ─── delete() ──────────────────────────────────────────────────────────────
  describe('delete()', () => {
    it('should DELETE product by id', () => {
      let completed = false;

      service.delete('1').subscribe({ complete: () => (completed = true) });

      const req = httpMock.expectOne('/api/products/1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null);

      expect(completed).toBeTrue();
    });
  });
});
