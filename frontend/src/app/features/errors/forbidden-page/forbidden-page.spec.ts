import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ForbiddenPage } from './forbidden-page';

describe('ForbiddenPage', () => {
  let component: ForbiddenPage;
  let fixture: ComponentFixture<ForbiddenPage>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForbiddenPage],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ForbiddenPage);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show the 403 message', () => {
    expect(element.querySelector('h1')?.textContent).toContain('403');
    expect(element.querySelector('h2')?.textContent).toContain('Accesso Negato');
  });

  it('should link back to the home page', () => {
    expect(element.querySelector('a')?.getAttribute('href')).toBe('/');
  });
});
