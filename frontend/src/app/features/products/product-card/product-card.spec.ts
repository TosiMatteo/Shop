import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductCardComponent } from './product-card';
import { CartService } from '../../../core/services/cart/cart-service';
import { Product } from '../../../core/models/product';

describe('ProductCardComponent', () => {
  let component: ProductCardComponent;
  let fixture: ComponentFixture<ProductCardComponent>;
  let cartServiceMock: jasmine.SpyObj<CartService>;

  const mockProduct: Product = {
    id: '1',
    title: 'Prodotto di test',
    description: 'Descrizione',
    price: 99.99,
    original_price: 149.99,
    sale: true,
    thumbnail_url: 'https://example.com/img.jpg',
    tags: ['tag1'],
    created_at: '2025-01-01',
  };

  beforeEach(async () => {
    cartServiceMock = jasmine.createSpyObj<CartService>('CartService', ['addItem']);

    await TestBed.configureTestingModule({
      imports: [ProductCardComponent],
      providers: [{ provide: CartService, useValue: cartServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('product', mockProduct);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show the product title', () => {
    expect(fixture.nativeElement.textContent).toContain('Prodotto di test');
  });

  it('should add one unit of the product to the cart', () => {
    component.addToCart();

    expect(cartServiceMock.addItem).toHaveBeenCalledOnceWith(mockProduct);
  });

  it('should show the description only after clicking the title', () => {
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('.description')).toBeNull();

    element.querySelector<HTMLElement>('.title')!.click();
    fixture.detectChanges();

    expect(element.querySelector('.description')?.textContent).toContain('Descrizione');
  });
});
