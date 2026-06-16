import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { AdminPage } from './admin-page';
import { ProductApi } from '../../../core/services/product/product-service';
import { TagService } from '../../../core/services/product/tag-service';
import { Product } from '../../../core/models/product';
import { Tag } from '../../../core/models/tag';

describe('AdminPage', () => {
  let component: AdminPage;
  let fixture: ComponentFixture<AdminPage>;
  let productApiMock: jasmine.SpyObj<ProductApi>;
  let tagServiceMock: jasmine.SpyObj<TagService>;

  const sampleProduct: Product = {
    id: '1',
    title: 'Prodotto test',
    description: 'Descrizione',
    price: 80,
    original_price: 100,
    sale: true,
    tags: ['Elettronica'],
    created_at: '2025-01-01',
  };

  const sampleTags: Tag[] = [
    { id: 1, name: 'Elettronica' },
    { id: 2, name: 'Casa' }
  ];

  beforeEach(async () => {
    productApiMock = jasmine.createSpyObj<ProductApi>('ProductApi', ['list', 'show', 'create', 'update', 'delete']);
    tagServiceMock = jasmine.createSpyObj<TagService>('TagService', ['list', 'create', 'update', 'delete']);

    // Valori predefiniti per i mock
    productApiMock.list.and.returnValue(of({ pagy: {} as any, products: [] }));
    productApiMock.show.and.returnValue(of(sampleProduct));
    tagServiceMock.list.and.returnValue(of(sampleTags));

    await TestBed.configureTestingModule({
      imports: [AdminPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: ProductApi, useValue: productApiMock },
        { provide: TagService, useValue: tagServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ─── Form init ──────────────────────────────────────────────────────────

  it('should initialize productForm with default values', () => {
    expect(component.productForm.get('title')?.value).toBe('');
    expect(component.productForm.get('original_price')?.value).toBeNull();
    expect(component.productForm.get('discount_percentage')?.value).toBe(0);
    expect(component.productForm.get('tag_ids')?.value).toEqual([]);
  });

  it('should invalidate productForm when title is empty', () => {
    component.productForm.patchValue({ title: '', original_price: 100 });
    expect(component.productForm.invalid).toBeTrue();
  });

  it('should validate productForm with correct values', () => {
    component.productForm.patchValue({ title: 'Ok', original_price: 100 });
    expect(component.productForm.valid).toBeTrue();
  });

  // ─── loadProducts ──────────────────────────────────────────────────────

  it('should load products on init and search', () => {
    const products = [sampleProduct];
    productApiMock.list.and.returnValue(of({ pagy: {} as any, products }));
    component.loadProducts('');
    expect(component.products).toEqual(products);
  });

  // ─── onEdit ────────────────────────────────────────────────────────────

  it('should populate form and open panel on edit', () => {
    spyOn(component.productPanel, 'open');
    component.tags = sampleTags;
    const fullProduct = { ...sampleProduct, tags: ['Elettronica'], };
    productApiMock.show.and.returnValue(of(fullProduct));

    component.onEdit(fullProduct);

    expect(productApiMock.show).toHaveBeenCalledWith(fullProduct.id);
    expect(component.formMode).toBe('edit');
    expect(component.editingProduct).toEqual(fullProduct);
    expect(component.productForm.get('title')?.value).toBe(fullProduct.title);
    expect(component.productPanel.open).toHaveBeenCalled();
  });

  // ─── onSubmit (create) ──────────────────────────────────────────────────

  it('should call create API on valid submit in create mode', () => {
    productApiMock.create.and.returnValue(of({ ...sampleProduct, title: 'Nuovo' }));
    component.formMode = 'create';
    component.productForm.setValue({
      title: 'Nuovo',
      description: '',
      original_price: 90,
      discount_percentage: 10,
      tag_ids: [1],
    });

    component.onSubmit();

    expect(productApiMock.create).toHaveBeenCalled();
    expect(component.loading).toBeFalse();
    expect(component.products.length).toBe(1);
  });

  it('should not call API when form invalid', () => {
    component.formMode = 'create';
    component.productForm.patchValue({ title: '' });
    component.onSubmit();
    expect(productApiMock.create).not.toHaveBeenCalled();
  });

  // ─── onSubmit (edit) ────────────────────────────────────────────────────

  it('should call update API in edit mode', () => {
    const updatedProduct = { ...sampleProduct, title: 'Modificato' };
    productApiMock.update.and.returnValue(of(updatedProduct));
    component.formMode = 'edit';
    component.editingProduct = sampleProduct;
    component.productForm.setValue({
      title: 'Modificato',
      description: '',
      original_price: 100,
      discount_percentage: 0,
      tag_ids: [],
    });

    component.onSubmit();

    expect(productApiMock.update).toHaveBeenCalledWith(sampleProduct.id, jasmine.any(FormData));
    expect(component.loading).toBeFalse();
  });

  // ─── onDelete ──────────────────────────────────────────────────────────

  it('should delete product after confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    productApiMock.delete.and.returnValue(of(null));
    component.products = [sampleProduct];
    component.onDelete(sampleProduct);

    expect(productApiMock.delete).toHaveBeenCalledWith(sampleProduct.id);
    expect(component.products.length).toBe(0);
  });

  // ─── Tags ──────────────────────────────────────────────────────────────

  it('should toggle tag in form', () => {
    component.toggleTag(1);
    expect(component.productForm.get('tag_ids')?.value).toEqual([1]);
    component.toggleTag(1);
    expect(component.productForm.get('tag_ids')?.value).toEqual([]);
  });

  it('should submit new tag', () => {
    const newTag: Tag = { id: 3, name: 'Nuovo tag' };
    tagServiceMock.create.and.returnValue(of(newTag));
    component.tagForm.setValue({ name: 'Nuovo tag' });
    component.onSubmitTag();

    expect(tagServiceMock.create).toHaveBeenCalledWith('Nuovo tag');
    expect(component.tags).toContain(newTag);
    expect(component.tagLoading).toBeFalse();
  });

  it('should submit tag edit', () => {
    const updated: Tag = { id: 1, name: 'Modificato' };
    tagServiceMock.update.and.returnValue(of(updated));
    component.editingTag = { id: 1, name: 'Vecchio' };
    component.tagFormMode = 'edit';
    component.tagForm.setValue({ name: 'Modificato' });
    component.onSubmitTag();

    expect(tagServiceMock.update).toHaveBeenCalledWith(1, 'Modificato');
  });

  it('should delete tag after confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    tagServiceMock.delete.and.returnValue(of(undefined));
    component.tags = sampleTags;
    component.onDeleteTag(sampleTags[0]);

    expect(tagServiceMock.delete).toHaveBeenCalledWith(sampleTags[0].id);
    expect(component.tags.length).toBe(1);
  });
});
