import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { PageEvent } from '@angular/material/paginator';

import { ProductPage } from './product-page';
import { ProductApi } from '../../../core/services/product/product-service';
import { TagService } from '../../../core/services/product/tag-service';
import { ProductsResponse } from '../../../core/models/product';

describe('ProductPage', () => {
  let component: ProductPage;
  let fixture: ComponentFixture<ProductPage>;
  let productApiMock: jasmine.SpyObj<ProductApi>;
  let tagServiceMock: jasmine.SpyObj<TagService>;

  // Minimal empty response to satisfy the response$ observable.
  const mockResponse: ProductsResponse = {
    pagy: { page: 1, count: 0, limit: 12, last: 1, from: 1, to: 0, prev: null, next: null },
    products: [],
  };

  beforeEach(async () => {
    productApiMock = jasmine.createSpyObj<ProductApi>('ProductApi', ['list']);
    tagServiceMock = jasmine.createSpyObj<TagService>('TagService', ['list']);

    productApiMock.list.and.returnValue(of(mockResponse));
    tagServiceMock.list.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [ProductPage],
      providers: [
        provideRouter([]),
        { provide: ProductApi, useValue: productApiMock },
        { provide: TagService, useValue: tagServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Helper to read the protected BehaviorSubject value without TypeScript errors.
  const filters = () => (component as any).filters$.value;

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ─── filters$ initial state ───────────────────────────────────────────────

  describe('filters$ initial state', () => {
    it('should initialise with correct default values', () => {
      expect(filters().title).toBe('');
      expect(filters().sort).toBe('dateDesc');
      expect(filters().priceFilter).toEqual({ min: null, max: null });
      expect(filters().saleFilter).toBeFalse();
      expect(filters().tag).toBeNull();
      expect(filters().page).toBe(1);
      expect(filters().limit).toBe(12);
    });
  });

  // ─── updateTitle() ────────────────────────────────────────────────────────

  describe('updateTitle()', () => {
    it('should update title and reset page to 1', () => {
      (component as any).filters$.next({ ...filters(), page: 3 });

      component.updateTitle('scarpe');

      expect(filters().title).toBe('scarpe');
      expect(filters().page).toBe(1);
    });

    it('should call ProductApi.list() with updated title after debounce', fakeAsync(() => {

      const localFixture = TestBed.createComponent(ProductPage);
      const localComponent = localFixture.componentInstance;
      localFixture.detectChanges();

      // Fire the initial debounce so combineLatest emits at least once.
      tick(300);
      productApiMock.list.calls.reset();

      localComponent.updateTitle('giacca');
      tick(300);

      expect(productApiMock.list).toHaveBeenCalledWith(
        jasmine.objectContaining({ title: 'giacca' })
      );

      localFixture.destroy();
    }));
  });

  // ─── updateSort() ─────────────────────────────────────────────────────────

  describe('updateSort()', () => {
    it('should update sort and reset page to 1', () => {
      (component as any).filters$.next({ ...filters(), page: 2 });

      component.updateSort('priceAsc');

      expect(filters().sort).toBe('priceAsc');
      expect(filters().page).toBe(1);
    });
  });

  // ─── updatePriceMin() / updatePriceMax() ─────────────────────────────────

  describe('updatePriceMin()', () => {
    it('should set min price from a valid number', () => {
      component.updatePriceMin(10);
      expect(filters().priceFilter.min).toBe(10);
    });

    it('should set min price to null for empty string', () => {
      component.updatePriceMin('');
      expect(filters().priceFilter.min).toBeNull();
    });

    it('should set min price to null for a non-numeric string', () => {
      component.updatePriceMin('abc');
      expect(filters().priceFilter.min).toBeNull();
    });

    it('should reset page to 1 when min price changes', () => {
      (component as any).filters$.next({ ...filters(), page: 3 });
      component.updatePriceMin(5);
      expect(filters().page).toBe(1);
    });
  });

  describe('updatePriceMax()', () => {
    it('should set max price from a valid number', () => {
      component.updatePriceMax(100);
      expect(filters().priceFilter.max).toBe(100);
    });

    it('should set max price to null for empty string', () => {
      component.updatePriceMax('');
      expect(filters().priceFilter.max).toBeNull();
    });

    it('should not overwrite min when max changes', () => {
      component.updatePriceMin(20);
      component.updatePriceMax(80);
      expect(filters().priceFilter.min).toBe(20);
      expect(filters().priceFilter.max).toBe(80);
    });
  });

  // ─── updateSale() ─────────────────────────────────────────────────────────

  describe('updateSale()', () => {
    it('should set saleFilter to true and reset page to 1', () => {
      (component as any).filters$.next({ ...filters(), page: 2 });

      component.updateSale(true);

      expect(filters().saleFilter).toBeTrue();
      expect(filters().page).toBe(1);
    });

    it('should set saleFilter back to false', () => {
      component.updateSale(true);
      component.updateSale(false);
      expect(filters().saleFilter).toBeFalse();
    });
  });

  // ─── updateTags() ─────────────────────────────────────────────────────────

  describe('updateTags()', () => {
    it('should set tag and reset page to 1', () => {
      (component as any).filters$.next({ ...filters(), page: 2 });

      component.updateTags('offerte');

      expect(filters().tag).toBe('offerte');
      expect(filters().page).toBe(1);
    });

    it('should set tag to null when called with null', () => {
      component.updateTags('offerte');
      component.updateTags(null);
      expect(filters().tag).toBeNull();
    });
  });

  // ─── onPage() ─────────────────────────────────────────────────────────────

  describe('onPage()', () => {
    it('should convert 0-based pageIndex to 1-based backend page', () => {
      const event: PageEvent = { pageIndex: 2, pageSize: 12, length: 100 };
      component.onPage(event);
      expect(filters().page).toBe(3);
    });

    it('should update limit from pageSize', () => {
      const event: PageEvent = { pageIndex: 0, pageSize: 24, length: 100 };
      component.onPage(event);
      expect(filters().limit).toBe(24);
    });
  });
});
