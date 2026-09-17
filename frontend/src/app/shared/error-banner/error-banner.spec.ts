import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ErrorBanner } from './error-banner';
import { ErrorService } from '../../core/services/error-service';

describe('ErrorBanner', () => {
  let component: ErrorBanner;
  let fixture: ComponentFixture<ErrorBanner>;
  let element: HTMLElement;
  let errorService: ErrorService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorBanner],
      providers: [provideRouter([])],
    }).compileComponents();

    // Servizio reale: il banner legge direttamente il suo signal.
    errorService = TestBed.inject(ErrorService);
    fixture = TestBed.createComponent(ErrorBanner);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render nothing when there is no error', () => {
    expect(element.querySelector('[role="alert"]')).toBeNull();
  });

  it('should show the message and the details of the current error', () => {
    errorService.setError({
      statusCode: 422,
      message: 'Validazione fallita',
      details: ['Title non può essere vuoto'],
    });
    fixture.detectChanges();

    expect(element.querySelector('.error-banner__message')?.textContent).toContain(
      'Validazione fallita',
    );
    expect(element.querySelectorAll('.error-banner__details li').length).toBe(1);
  });

  it('should clear the error when the close button is clicked', () => {
    errorService.setError({ statusCode: 500, message: 'Errore' });
    fixture.detectChanges();

    element.querySelector<HTMLButtonElement>('.error-banner__close')!.click();
    fixture.detectChanges();

    expect(errorService.error()).toBeNull();
    expect(element.querySelector('[role="alert"]')).toBeNull();
  });
});
