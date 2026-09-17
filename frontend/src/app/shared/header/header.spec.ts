import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { Header } from './header';
import { AuthService } from '../../core/services/auth/auth-service';
import { CartService } from '../../core/services/cart/cart-service';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;
  let authServiceMock: jasmine.SpyObj<AuthService>;
  let loginEvent: Subject<void>;
  let logoutEvent: Subject<void>;
  let navigateSpy: jasmine.Spy;

  const mockMeResponse = { user: { first_name: 'Mario' } };

  /** Crea il componente dopo aver configurato lo stato di autenticazione. */
  function createComponent(): void {
    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    authServiceMock = jasmine.createSpyObj<AuthService>('AuthService', [
      'isAuthenticated',
      'isAdmin',
      'getCurrentUser',
      'logout',
    ]);
    authServiceMock.isAuthenticated.and.returnValue(false);
    authServiceMock.isAdmin.and.returnValue(false);
    authServiceMock.getCurrentUser.and.returnValue(of(mockMeResponse));
    authServiceMock.logout.and.returnValue(of({}));

    // Assegnazione forzata per le proprietà readonly.
    loginEvent = new Subject<void>();
    logoutEvent = new Subject<void>();
    (authServiceMock as any).loginEvent$ = loginEvent.asObservable();
    (authServiceMock as any).logoutEvent$ = logoutEvent.asObservable();

    const cartServiceMock = jasmine.createSpyObj<CartService>('CartService', [], {
      cart$: of(null),
    });

    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        { provide: CartService, useValue: cartServiceMock },
      ],
    }).compileComponents();

    navigateSpy = spyOn(TestBed.inject(Router), 'navigate');
  });

  it('should create', () => {
    createComponent();

    expect(component).toBeTruthy();
  });

  // ─── Nome del cliente ──────────────────────────────────────────────────────
  describe('customer name', () => {
    it('should stay empty for a guest', () => {
      createComponent();

      expect(component.customerName).toBe('');
      expect(authServiceMock.getCurrentUser).not.toHaveBeenCalled();
    });

    it('should show the first name of an authenticated customer', () => {
      authServiceMock.isAuthenticated.and.returnValue(true);

      createComponent();

      expect(component.customerName).toBe('Mario');
      expect(fixture.nativeElement.textContent).toContain('Benvenuto Mario');
    });

    it('should stay empty for an admin', () => {
      authServiceMock.isAuthenticated.and.returnValue(true);
      authServiceMock.isAdmin.and.returnValue(true);

      createComponent();

      expect(component.customerName).toBe('');
      expect(authServiceMock.getCurrentUser).not.toHaveBeenCalled();
    });

    it('should stay empty when the profile request fails', () => {
      authServiceMock.isAuthenticated.and.returnValue(true);
      authServiceMock.getCurrentUser.and.returnValue(throwError(() => new Error('fail')));

      createComponent();

      expect(component.customerName).toBe('');
    });

    it('should load the name after a login and clear it after a logout', () => {
      createComponent();

      authServiceMock.isAuthenticated.and.returnValue(true);
      loginEvent.next();
      expect(component.customerName).toBe('Mario');

      logoutEvent.next();
      expect(component.customerName).toBe('');
    });
  });

  // ─── manageSession() ───────────────────────────────────────────────────────
  describe('manageSession()', () => {
    it('should log out and go to /products when authenticated', () => {
      authServiceMock.isAuthenticated.and.returnValue(true);
      createComponent();

      component.manageSession();

      expect(authServiceMock.logout).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledOnceWith(['/products']);
    });

    it('should go to /login when the logout fails', () => {
      authServiceMock.isAuthenticated.and.returnValue(true);
      authServiceMock.logout.and.returnValue(throwError(() => new Error('fail')));
      createComponent();

      component.manageSession();

      expect(navigateSpy).toHaveBeenCalledOnceWith(['/login']);
    });

    it('should go to /login when nobody is authenticated', () => {
      createComponent();

      component.manageSession();

      expect(authServiceMock.logout).not.toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledOnceWith(['/login']);
    });
  });

  // ─── orders() ──────────────────────────────────────────────────────────────
  describe('orders()', () => {
    it('should navigate to /orders when authenticated', () => {
      authServiceMock.isAuthenticated.and.returnValue(true);
      createComponent();

      component.orders();

      expect(navigateSpy).toHaveBeenCalledOnceWith(['/orders']);
    });

    it('should do nothing for a guest', () => {
      createComponent();

      component.orders();

      expect(navigateSpy).not.toHaveBeenCalled();
    });
  });
});
