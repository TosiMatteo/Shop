import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminProductCard } from './admin-product-card';

describe('AdminProductCard', () => {
  let component: AdminProductCard;
  let fixture: ComponentFixture<AdminProductCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminProductCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminProductCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
