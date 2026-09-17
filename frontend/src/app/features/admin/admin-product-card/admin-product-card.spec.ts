import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminProductCard } from './admin-product-card';
import { Product } from '../../../core/models/product';

describe('AdminProductCard', () => {
  let component: AdminProductCard;
  let fixture: ComponentFixture<AdminProductCard>;
  let element: HTMLElement;

  const mockProduct: Product = {
    id: '1',
    title: 'Prodotto test',
    description: 'Descrizione test',
    price: 75,
    original_price: 100,
    sale: true,
    thumbnail_url: 'https://example.com/img.jpg',
    tags: ['test'],
    created_at: '2025-01-01',
  };

  function setProduct(product: Product): void {
    fixture.componentRef.setInput('product', product);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminProductCard],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminProductCard);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    setProduct(mockProduct);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ─── Rendering ─────────────────────────────────────────────────────────────
  it('should show the title and the discount of a product on sale', () => {
    expect(element.querySelector('.card-title')?.textContent).toContain('Prodotto test');
    expect(element.querySelector('.sale-badge')?.textContent).toContain('-25%');
  });

  it('should hide the discount of a product not on sale', () => {
    setProduct({ ...mockProduct, sale: false, price: 100 });

    expect(element.querySelector('.sale-badge')).toBeNull();
  });

  it('should show a placeholder when the product has no image', () => {
    setProduct({ ...mockProduct, thumbnail_url: undefined });

    expect(element.querySelector('.no-image')).not.toBeNull();
    expect(element.querySelector('img')).toBeNull();
  });

  // ─── Azioni ────────────────────────────────────────────────────────────────
  it('should emit edit with the product when the edit button is clicked', () => {
    spyOn(component.edit, 'emit');

    element.querySelector<HTMLButtonElement>('button[aria-label="Modifica"]')!.click();

    expect(component.edit.emit).toHaveBeenCalledOnceWith(mockProduct);
  });

  it('should emit delete with the product when the delete button is clicked', () => {
    spyOn(component.delete, 'emit');

    element.querySelector<HTMLButtonElement>('button[aria-label="Elimina"]')!.click();

    expect(component.delete.emit).toHaveBeenCalledOnceWith(mockProduct);
  });
});
