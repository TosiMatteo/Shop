import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductCardComponent } from './product-card';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

describe('ProductCard', () => {
  let component: ProductCardComponent;
  let fixture: ComponentFixture<ProductCardComponent>;

  const mockProduct = {
    id: '1',
    title: 'Prodotto di test',
    description: 'Descrizione',
    price: 99.99,
    original_price: 149.99,
    sale: true,
    thumbnail_url: 'https://example.com/img.jpg',  // proprietà mancante nel tuo template
    tags: ['tag1'],
    created_at: '2025-01-01'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCardComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductCardComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput('product', mockProduct);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
