import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminProductCard } from './admin-product-card';
import {provideRouter} from '@angular/router';
import {provideHttpClient} from '@angular/common/http';

describe('AdminProductCard', () => {
  let component: AdminProductCard;
  let fixture: ComponentFixture<AdminProductCard>;

  const mockProduct = {
    id: '1',
    title: 'Prodotto test',
    description: 'Descrizione test',
    price: 99.99,
    original_price: 129.99,
    sale: true,
    thumbnail_url: 'https://example.com/img.jpg',  // 👈 proprietà richiesta
    tags: ['test'],
    created_at: '2025-01-01'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminProductCard],
      providers:[
        provideRouter([]),
        provideHttpClient(),
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminProductCard);
    component = fixture.componentInstance;

    fixture.componentInstance.product = mockProduct;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
