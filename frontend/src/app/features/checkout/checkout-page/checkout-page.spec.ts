import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { CheckoutPage } from './checkout-page';
import { CartCardComponent } from '../cart-card/cart-card';
import { CartService } from '../../../core/services/cart/cart-service';
import { CheckoutResponse } from '../../../core/models/checkout';

describe('CheckoutPage', () => {
  let component: CheckoutPage;
  let fixture: ComponentFixture<CheckoutPage>;
  let cartServiceMock: jasmine.SpyObj<CartService>;
  let navigateSpy: jasmine.Spy;

  const mockCheckoutResponse: CheckoutResponse = {
    id: 1,
    total: '20.00',
    status: 'processing',
    shipping_name: 'Mario Rossi',
    order_items: 1,
  };

  const mockFormValue = {
    firstName: 'Mario',
    lastName: 'Rossi',
    street: 'Via Roma 1',
    city: 'Bologna',
    zip: '40100',
    privacy: true,
  };

  beforeEach(async () => {
    cartServiceMock = jasmine.createSpyObj<CartService>('CartService', ['checkout']);
    cartServiceMock.checkout.and.returnValue(of(mockCheckoutResponse));

    await TestBed.configureTestingModule({
      imports: [CheckoutPage],
      providers: [
        provideRouter([]),
        { provide: CartService, useValue: cartServiceMock },
      ],
    })
      .overrideComponent(CheckoutPage, {
        remove: { imports: [CartCardComponent] },
        add: { schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(CheckoutPage);
    component = fixture.componentInstance;
    navigateSpy = spyOn(TestBed.inject(Router), 'navigate');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ─── hasError() ────────────────────────────────────────────────────────────
  describe('hasError()', () => {
    it('should not report errors on an invalid field that has not been touched', () => {
      expect(component.hasError('firstName', 'required')).toBeFalse();
    });

    it('should report the required error once the field has been touched', () => {
      component.form.get('firstName')!.markAsTouched();
      expect(component.hasError('firstName', 'required')).toBeTrue();
    });

    it('should not report errors on a touched valid field', () => {
      const control = component.form.get('firstName')!;
      control.setValue('Mario');
      control.markAsTouched();
      expect(component.hasError('firstName', 'required')).toBeFalse();
    });

    it('should validate the zip code pattern (5 digits)', () => {
      const zip = component.form.get('zip')!;
      zip.setValue('123');
      zip.markAsTouched();
      expect(component.hasError('zip', 'pattern')).toBeTrue();

      zip.setValue('40100');
      expect(component.hasError('zip', 'pattern')).toBeFalse();
    });
  });

  // ─── onSubmit() ────────────────────────────────────────────────────────────
  describe('onSubmit() with an invalid form', () => {
    it('should not call checkout and should mark every field as touched', () => {
      component.onSubmit();

      expect(cartServiceMock.checkout).not.toHaveBeenCalled();
      expect(component.form.touched).toBeTrue();
      expect(component.form.get('privacy')!.touched).toBeTrue();
      expect(component.loading).toBeFalse();
    });
  });

  describe('onSubmit() with a valid form', () => {
    it('should call cartService.checkout with the mapped shipping data', fakeAsync(() => {
      component.form.setValue(mockFormValue);

      component.onSubmit();

      expect(cartServiceMock.checkout).toHaveBeenCalledWith({
        name: 'Mario Rossi',
        street: 'Via Roma 1',
        city: 'Bologna',
        zip: '40100',
      });

      tick(2000);
    }));

    it('should set loading while the request is in flight and reset it at the end', fakeAsync(() => {
      const checkout$ = new Subject<CheckoutResponse>();
      cartServiceMock.checkout.and.returnValue(checkout$);
      component.form.setValue(mockFormValue);

      component.onSubmit();
      expect(component.loading).toBeTrue();

      checkout$.next(mockCheckoutResponse);
      checkout$.complete();

      expect(component.loading).toBeFalse();

      tick(2000);
    }));

    it('should show the confirmation, reset the form and navigate to /orders after 2s on success', fakeAsync(() => {
      component.form.setValue(mockFormValue);

      component.onSubmit();

      expect(component.orderSuccess).toBeTrue();
      expect(component.form.pristine).toBeTrue();
      expect(navigateSpy).not.toHaveBeenCalled();

      tick(2000);

      expect(navigateSpy).toHaveBeenCalledWith(['/orders']);
    }));
  });
});
