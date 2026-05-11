import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CartCardComponent } from './cart-card';

describe('CartCard', () => {
  let component: CartCardComponent;
  let fixture: ComponentFixture<CartCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CartCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
