import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { of, Subject } from 'rxjs';

import { CheckoutPage } from './checkout-page';
import { CartCardComponent } from '../cart-card/cart-card';
import { CartService } from '../../../core/services/cart/cart-service';

describe('CheckoutPage', () => {
  let component: CheckoutPage;
  let fixture: ComponentFixture<CheckoutPage>;
  let cartServiceMock: { checkout: jasmine.Spy };
  let navigateSpy: jasmine.Spy;

  const VALID_FORM_VALUE = {
    firstName: 'Mario',
    lastName: 'Rossi',
    street: 'Via Roma 1',
    city: 'Bologna',
    zip: '40100',
    privacy: true,
  };

  beforeEach(async () => {
    cartServiceMock = {
      checkout: jasmine.createSpy('checkout').and.returnValue(of({})),
    };

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

  describe('hasError', () => {
    it('non segnala errori su un campo non ancora "touched", anche se invalido', () => {
      expect(component.hasError('firstName', 'required')).toBeFalse();
    });

    it('segnala l\'errore "required" una volta che il campo è stato toccato', () => {
      component.form.get('firstName')!.markAsTouched();
      expect(component.hasError('firstName', 'required')).toBeTrue();
    });

    it('non segnala errori su un campo toccato e valido', () => {
      const control = component.form.get('firstName')!;
      control.setValue('Mario');
      control.markAsTouched();
      expect(component.hasError('firstName', 'required')).toBeFalse();
    });

    it('valida il pattern del CAP (5 cifre)', () => {
      const zip = component.form.get('zip')!;
      zip.setValue('123');
      zip.markAsTouched();
      expect(component.hasError('zip', 'pattern')).toBeTrue();

      zip.setValue('40100');
      expect(component.hasError('zip', 'pattern')).toBeFalse();
    });
  });

  describe('onSubmit - form non valido', () => {
    it('non chiama checkout e marca tutti i campi come touched', () => {
      component.onSubmit();

      expect(cartServiceMock.checkout).not.toHaveBeenCalled();
      expect(component.form.touched).toBeTrue();
      expect(component.form.get('privacy')!.touched).toBeTrue();
      expect(component.loading).toBeFalse();
    });
  });

  describe('onSubmit - form valido', () => {
    it('chiama cartService.checkout con i dati di spedizione mappati correttamente', fakeAsync(() => {
      component.form.setValue(VALID_FORM_VALUE);

      component.onSubmit();

      expect(cartServiceMock.checkout).toHaveBeenCalledWith({
        name: 'Mario Rossi',
        street: 'Via Roma 1',
        city: 'Bologna',
        zip: '40100',
      });

      tick(2000);
    }));

    it('imposta loading a true durante la richiesta e a false al suo termine', fakeAsync(() => {
      const checkout$ = new Subject<unknown>();
      cartServiceMock.checkout.and.returnValue(checkout$);
      component.form.setValue(VALID_FORM_VALUE);

      component.onSubmit();
      expect(component.loading).toBeTrue();

      checkout$.next({});
      checkout$.complete();

      expect(component.loading).toBeFalse();

      tick(2000);
    }));

    it('al successo mostra la conferma, resetta il form e naviga a /orders dopo 2s', fakeAsync(() => {
      component.form.setValue(VALID_FORM_VALUE);

      component.onSubmit();

      expect(component.orderSuccess).toBeTrue();
      expect(component.form.pristine).toBeTrue();
      expect(navigateSpy).not.toHaveBeenCalled();

      tick(2000);

      expect(navigateSpy).toHaveBeenCalledWith(['/orders']);
    }));
  });
});
