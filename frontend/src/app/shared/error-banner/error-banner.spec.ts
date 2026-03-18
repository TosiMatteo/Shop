import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ErrorBanner } from './error-banner';

describe('ErrorBanner', () => {
  let component: ErrorBanner;
  let fixture: ComponentFixture<ErrorBanner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorBanner]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ErrorBanner);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
