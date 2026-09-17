import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render header, error banner and router outlet', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('app-header')).not.toBeNull();
    expect(element.querySelector('app-error-banner')).not.toBeNull();
    expect(element.querySelector('router-outlet')).not.toBeNull();
  });
});
