import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CartCard } from './cart-card';

describe('CartCard', () => {
  let component: CartCard;
  let fixture: ComponentFixture<CartCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CartCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
