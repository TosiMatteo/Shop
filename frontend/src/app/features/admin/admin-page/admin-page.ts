import {Component, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Tag} from '../../../core/models/tag';
import {Product} from '../../../core/models/product';
import {ProductApi} from '../../../core/services/product/product-service';
import {TagService} from '../../../core/services/product/tag-service';
import {debounceTime, distinctUntilChanged} from 'rxjs';
import {MatError, MatFormField, MatInput, MatLabel} from '@angular/material/input';
import {MatCheckbox} from '@angular/material/checkbox';
import {MatDivider} from '@angular/material/list';
import {MatIcon} from '@angular/material/icon';
import {AdminProductCard} from '../admin-product-card/admin-product-card';
import {MatButton, MatIconButton} from '@angular/material/button';
import {
  MatExpansionPanel,
  MatExpansionPanelDescription,
  MatExpansionPanelHeader,
  MatExpansionPanelTitle
} from '@angular/material/expansion';

@Component({
  selector: 'app-admin-page',
  imports: [
    MatFormField,
    MatLabel,
    ReactiveFormsModule,
    MatError,
    MatCheckbox,
    MatDivider,
    MatIcon,
    AdminProductCard,
    MatInput,
    MatButton,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    MatExpansionPanelDescription,
    MatIconButton
  ],
  templateUrl: './admin-page.html',
  styleUrl: './admin-page.scss',
})
export class AdminPage implements OnInit {
  productForm: FormGroup;
  // Debounced title search for product list.
  searchControl = new FormControl('');
  @ViewChild('productPanel') productPanel!: MatExpansionPanel;

  //products
  tags: Tag[] = [];
  products: Product[] = [];
  formMode: 'create' | 'edit' = 'create';
  editingProduct: Product | null = null;
  thumbnailFile: File | null = null;
  loading = false;

  //tags
  tagForm: FormGroup;
  tagFormMode: 'create' | 'edit' = 'create';
  editingTag: Tag | null = null;
  tagLoading = false;


  constructor(
    private fb: FormBuilder,
    private productApi: ProductApi,
    private tagService: TagService
  ) {
    this.productForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      original_price: [null, [Validators.required, Validators.min(0)]],
      tag_ids: [[]],
      discount_percentage: [0, [Validators.min(0), Validators.max(99)]]
    });

    this.tagForm = this.fb.group({
      name: ['', Validators.required]
    })
  }

  ngOnInit(): void {
    // Initial bootstrap: load tags and products.
    this.tagService.list().subscribe(tags => (this.tags = tags));
    this.loadProducts('');

    this.searchControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(value => this.loadProducts(value ?? ''));
  }

  loadProducts(title: string): void {
    this.productApi.list({ title: title || null }).subscribe(
      response => (this.products = response.products)
    );
  }

  onThumbnailChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    // Keep only the first selected file as thumbnail source.
    this.thumbnailFile = input.files?.[0] ?? null;
  }

  isTagSelected(tagId: number): boolean {
    const ids: number[] = this.productForm.get('tag_ids')?.value ?? [];
    return ids.includes(tagId);
  }

  toggleTag(tagId: number): void {
    const current: number[] = this.productForm.get('tag_ids')?.value ?? [];
    // Toggle tag id in the form array.
    const updated = current.includes(tagId)
      ? current.filter(id => id !== tagId)
      : [...current, tagId];
    this.productForm.get('tag_ids')?.setValue(updated);
  }

  onEdit(product: Product): void {
    this.formMode = 'edit';
    this.editingProduct = product;

    // Map product tag names to ids expected by the form controls.
    const tagIds = this.tags
      .filter(t => (product.tags ?? []).includes(t.name))
      .map(t => t.id);

    const discountPercentage = this.computeDiscountPercentage(
      product.original_price,
      product.price
    );

    this.productForm.patchValue({
      title: product.title,
      description: product.description,
      original_price: product.original_price,
      discount_percentage: discountPercentage,
      tag_ids: tagIds,
    });

    this.productPanel.open();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onDelete(product: Product): void {
    if (!confirm(`Eliminare "${product.title}"?`)) return;
    this.productApi.delete(product.id).subscribe(() => {
      // Optimistic local update after successful delete.
      this.products = this.products.filter(p => p.id !== product.id);
    });
  }

  resetForm(): void {
    this.formMode = 'create';
    this.editingProduct = null;
    this.thumbnailFile = null;
    this.productForm.reset({ discount_percentage: 0, tag_ids: [] });
  }

  onSubmit(): void {
    if (this.productForm.invalid) return;

    const v = this.productForm.value;
    const originalPrice = Number(v.original_price);
    const discountPercentage = Number(v.discount_percentage ?? 0);
    const safeDiscount = Number.isFinite(discountPercentage)
      ? Math.min(99, Math.max(0, discountPercentage))
      : 0;
    const price = this.calculatePriceFromDiscount(originalPrice, safeDiscount);
    const sale = safeDiscount > 0 && price < originalPrice;

    // Use multipart payload to support optional thumbnail upload.
    const fd = new FormData();

    fd.append('product[title]', v.title);
    fd.append('product[description]', v.description ?? '');
    fd.append('product[original_price]', originalPrice.toString());
    fd.append('product[price]', price.toString());
    fd.append('product[sale]', sale ? 'true' : 'false');
    (v.tag_ids as number[]).forEach(id =>
      fd.append('product[tag_ids][]', id.toString())
    );
    if (this.thumbnailFile) {
      fd.append('product[thumbnail]', this.thumbnailFile);
    }

    this.loading = true;

    if (this.formMode === 'create') {
      this.productApi.create(fd).subscribe({
        next: product => {
          // Put newly created product first in list.
          this.products = [product, ...this.products];
          this.resetForm();
          this.loading = false;
        },
        error: () => (this.loading = false),
      });
    } else {
      this.productApi.update(this.editingProduct!.id, fd).subscribe({
        next: updated => {
          // Replace updated product in local list.
          this.products = this.products.map(p => (p.id === updated.id ? updated : p));
          this.resetForm();
          this.loading = false;
        },
        error: () => (this.loading = false),
      });
    }
  }

  private calculatePriceFromDiscount(originalPrice: number, discountPercentage: number): number {
    const discounted = originalPrice * (1 - discountPercentage / 100);
    return Number(discounted.toFixed(2));
  }

  private computeDiscountPercentage(originalPrice: number, price: number): number {
    if (!originalPrice || originalPrice <= 0 || price >= originalPrice) return 0;
    const discount = ((originalPrice - price) / originalPrice) * 100;
    return Math.round(discount);
  }

  onEditTag(tag: Tag): void {
    this.tagFormMode = 'edit';
    this.editingTag = tag;
    this.tagForm.patchValue({ name: tag.name });
  }

  onDeleteTag(tag: Tag): void {
    if (!confirm(`Eliminare il tag "${tag.name}"? Verrà rimosso da tutti i prodotti associati.`)) return;
    this.tagService.delete(tag.id).subscribe(() => {
      // Remove deleted tag from local collection.
      this.tags = this.tags.filter(t => t.id !== tag.id);
    });
  }

  resetTagForm(): void {
    this.tagFormMode = 'create';
    this.editingTag = null;
    this.tagForm.reset();
  }

  onSubmitTag(): void {
    if (this.tagForm.invalid) return;
    const name: string = this.tagForm.value.name;
    this.tagLoading = true;

    if (this.tagFormMode === 'create') {
      this.tagService.create(name).subscribe({
        next: tag => { this.tags = [...this.tags, tag]; this.resetTagForm(); this.tagLoading = false; },
        error: () => (this.tagLoading = false),
      });
    } else {
      this.tagService.update(this.editingTag!.id, name).subscribe({
        next: updated => { this.tags = this.tags.map(t => t.id === updated.id ? updated : t); this.resetTagForm(); this.tagLoading = false; },
        error: () => (this.tagLoading = false),
      });
    }
  }
}
