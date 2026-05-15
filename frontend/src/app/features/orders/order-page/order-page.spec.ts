import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { PageEvent } from '@angular/material/paginator';

import { OrderPage } from './order-page';
import { OrderService } from '../../../core/services/order/order-service';
import { AuthService } from '../../../core/services/auth/auth-service';

describe('OrderPage', () => {
  let component: OrderPage;
  let fixture: ComponentFixture<OrderPage>;
  let orderServiceMock: jasmine.SpyObj<OrderService>;
  let authServiceMock: jasmine.SpyObj<AuthService>;

  const mockResponse = {
    pagy: { page: 1, count: 0, limit: 10, last: 1, from: 1, to: 0, prev: null, next: null },
    orders: [],
  };

  beforeEach(async () => {
    orderServiceMock = jasmine.createSpyObj<OrderService>('OrderService', ['list']);
    authServiceMock  = jasmine.createSpyObj<AuthService>('AuthService', ['getMemberSince']);

    orderServiceMock.list.and.returnValue(of(mockResponse));
    authServiceMock.getMemberSince.and.returnValue(null);

    await TestBed.configureTestingModule({
      imports: [OrderPage],
      providers: [
        provideRouter([]),
        { provide: OrderService, useValue: orderServiceMock },
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // Helper to read the protected BehaviorSubject value.
  const filters = () => (component as any).filters$.value;

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ─── filters$ initial state ───────────────────────────────────────────────

  describe('filters$ initial state', () => {
    it('should initialise with correct default values', () => {
      expect(filters().totalFilter).toEqual({ min: null, max: null });
      expect(filters().sort).toBe('dateDesc');
      expect(filters().status).toBeNull();
      expect(filters().year).toBeNull();
      expect(filters().page).toBe(1);
      expect(filters().limit).toBe(10);
    });
  });

  // ─── availableYears ───────────────────────────────────────────────────────

  describe('availableYears', () => {
    it('should start from the current year', () => {
      const currentYear = new Date().getFullYear();
      expect((component as any).availableYears[0]).toBe(currentYear);
    });

    it('should fall back to 5 years when getMemberSince() returns null', () => {
      // getMemberSince returns null → fallback is current - 4 → list length = 5
      expect((component as any).availableYears.length).toBe(5);
    });

    it('should use getMemberSince() to determine the oldest year in the list', async () => {
      // Reconfigure with a specific member since year to verify the list length.
      const currentYear = new Date().getFullYear();
      authServiceMock.getMemberSince.and.returnValue(currentYear - 2);

      await TestBed.configureTestingModule({
        imports: [OrderPage],
        providers: [
          provideRouter([]),
          { provide: OrderService, useValue: orderServiceMock },
          { provide: AuthService, useValue: authServiceMock },
        ],
      }).compileComponents();

      const localFixture  = TestBed.createComponent(OrderPage);
      const localComponent = localFixture.componentInstance;
      localFixture.detectChanges();

      expect((localComponent as any).availableYears.length).toBe(3);
      expect((localComponent as any).availableYears.at(-1)).toBe(currentYear - 2);

      localFixture.destroy();
    });
  });

  // ─── updateSort() ─────────────────────────────────────────────────────────

  describe('updateSort()', () => {
    it('should update sort and reset page to 1', () => {
      (component as any).filters$.next({ ...filters(), page: 3 });

      (component as any).updateSort('dateAsc');

      expect(filters().sort).toBe('dateAsc');
      expect(filters().page).toBe(1);
    });
  });

  // ─── updateStatus() ───────────────────────────────────────────────────────

  describe('updateStatus()', () => {
    it('should update status and reset page to 1', () => {
      (component as any).filters$.next({ ...filters(), page: 2 });

      (component as any).updateStatus('completed');

      expect(filters().status).toBe('completed');
      expect(filters().page).toBe(1);
    });

    it('should set status to null when cleared', () => {
      (component as any).updateStatus('completed');
      (component as any).updateStatus(null);
      expect(filters().status).toBeNull();
    });
  });

  // ─── updateYear() ─────────────────────────────────────────────────────────

  describe('updateYear()', () => {
    it('should update year and reset page to 1', () => {
      (component as any).filters$.next({ ...filters(), page: 2 });

      (component as any).updateYear(2024);

      expect(filters().year).toBe(2024);
      expect(filters().page).toBe(1);
    });

    it('should set year to null when cleared', () => {
      (component as any).updateYear(2024);
      (component as any).updateYear(null);
      expect(filters().year).toBeNull();
    });
  });

  // ─── onPage() ─────────────────────────────────────────────────────────────

  describe('onPage()', () => {
    it('should convert 0-based pageIndex to 1-based backend page', () => {
      const event: PageEvent = { pageIndex: 2, pageSize: 10, length: 50 };
      (component as any).onPage(event);
      expect(filters().page).toBe(3);
    });

    it('should update limit from pageSize', () => {
      const event: PageEvent = { pageIndex: 0, pageSize: 20, length: 50 };
      (component as any).onPage(event);
      expect(filters().limit).toBe(20);
    });
  });

  // ─── updateMinTotal() / updateMaxTotal() ─────────────────────────────────

  describe('updateMinTotal()', () => {
    it('should update totalFilter.min after debounce and reset page to 1', fakeAsync(() => {
      // Component created inside fakeAsync so the debounce timer is in the fake zone.
      const localFixture  = TestBed.createComponent(OrderPage);
      const localComponent = localFixture.componentInstance;
      localFixture.detectChanges();

      (localComponent as any).filters$.next({ ...(localComponent as any).filters$.value, page: 3 });

      (localComponent as any).updateMinTotal('20');
      tick(400);

      expect((localComponent as any).filters$.value.totalFilter.min).toBe(20);
      expect((localComponent as any).filters$.value.page).toBe(1);

      localFixture.destroy();
    }));

    it('should set min to null when input is empty after debounce', fakeAsync(() => {
      const localFixture  = TestBed.createComponent(OrderPage);
      const localComponent = localFixture.componentInstance;
      localFixture.detectChanges();

      (localComponent as any).updateMinTotal('');
      tick(400);

      expect((localComponent as any).filters$.value.totalFilter.min).toBeNull();

      localFixture.destroy();
    }));
  });

  describe('updateMaxTotal()', () => {
    it('should update totalFilter.max after debounce and reset page to 1', fakeAsync(() => {
      const localFixture  = TestBed.createComponent(OrderPage);
      const localComponent = localFixture.componentInstance;
      localFixture.detectChanges();

      (localComponent as any).filters$.next({ ...(localComponent as any).filters$.value, page: 2 });

      (localComponent as any).updateMaxTotal('100');
      tick(400);

      expect((localComponent as any).filters$.value.totalFilter.max).toBe(100);
      expect((localComponent as any).filters$.value.page).toBe(1);

      localFixture.destroy();
    }));

    it('should not overwrite min when max changes', fakeAsync(() => {
      const localFixture  = TestBed.createComponent(OrderPage);
      const localComponent = localFixture.componentInstance;
      localFixture.detectChanges();

      (localComponent as any).updateMinTotal('10');
      (localComponent as any).updateMaxTotal('50');
      tick(400);

      expect((localComponent as any).filters$.value.totalFilter.min).toBe(10);
      expect((localComponent as any).filters$.value.totalFilter.max).toBe(50);

      localFixture.destroy();
    }));
  });
});
