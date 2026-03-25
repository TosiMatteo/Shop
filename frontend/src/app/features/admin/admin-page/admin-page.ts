import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Tag} from '../../../core/models/tag';
import {Product} from '../../../core/models/product';
import {ProductApi} from '../../../core/services/product/product-service';
import {TagService} from '../../../core/services/product/tag-service';
import {debounceTime, distinctUntilChanged} from 'rxjs';
import {MatError, MatFormField, MatInput, MatLabel} from '@angular/material/input';
import {MatCard, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';
import {MatCheckbox} from '@angular/material/checkbox';
import {MatDivider} from '@angular/material/list';
import {MatIcon} from '@angular/material/icon';
import {AdminProductCard} from '../admin-product-card/admin-product-card';
import {MatButton} from '@angular/material/button';

@Component({
  selector: 'app-admin-page',
  imports: [
    MatFormField,
    MatLabel,
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    ReactiveFormsModule,
    MatError,
    MatCheckbox,
    MatDivider,
    MatIcon,
    AdminProductCard,
    MatInput,
    MatButton
  ],
  templateUrl: './admin-page.html',
  styleUrl: './admin-page.scss',
})
export class AdminPage implements OnInit {
  productForm: FormGroup;
  searchControl = new FormControl('');

  tags: Tag[] = [];
  products: Product[] = [];
  formMode: 'create' | 'edit' = 'create';
  editingProduct: Product | null = null;
  thumbnailFile: File | null = null;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private productApi: ProductApi,
    private tagService: TagService
  ) {
    this.productForm = this.fb.group({
      title: ['', Validators.required],
      description: [''],
      price: [null, [Validators.required, Validators.min(0)]],
      original_price: [null, Validators.min(0)],
      sale: [false],
      tag_ids: [[]], // array di ID numerici
    });
  }

  ngOnInit(): void {
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
    this.thumbnailFile = input.files?.[0] ?? null;
  }

  isTagSelected(tagId: number): boolean {
    const ids: number[] = this.productForm.get('tag_ids')?.value ?? [];
    return ids.includes(tagId);
  }

  toggleTag(tagId: number): void {
    const current: number[] = this.productForm.get('tag_ids')?.value ?? [];
    const updated = current.includes(tagId)
      ? current.filter(id => id !== tagId)
      : [...current, tagId];
    this.productForm.get('tag_ids')?.setValue(updated);
  }

  onEdit(product: Product): void {
    this.formMode = 'edit';
    this.editingProduct = product;

    // Risolve i tag_ids dai nomi presenti nel prodotto, incrociandoli con i tag caricati
    const tagIds = this.tags
      .filter(t => (product.tags ?? []).includes(t.name))
      .map(t => t.id);

    this.productForm.patchValue({
      title: product.title,
      description: product.description,
      price: product.price,
      original_price: product.original_price,
      sale: product.sale,
      tag_ids: tagIds,
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onDelete(product: Product): void {
    if (!confirm(`Eliminare "${product.title}"?`)) return;
    this.productApi.delete(product.id).subscribe(() => {
      this.products = this.products.filter(p => p.id !== product.id);
    });
  }

  resetForm(): void {
    this.formMode = 'create';
    this.editingProduct = null;
    this.thumbnailFile = null;
    this.productForm.reset({ sale: false, tag_ids: [] });
  }

  onSubmit(): void {
    if (this.productForm.invalid) return;

    const v = this.productForm.value;
    const fd = new FormData();

    fd.append('product[title]', v.title);
    fd.append('product[description]', v.description ?? '');
    fd.append('product[price]', v.price.toString());
    fd.append('product[original_price]', (v.original_price ?? v.price).toString());
    fd.append('product[sale]', v.sale ? 'true' : 'false');
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
          this.products = [product, ...this.products];
          this.resetForm();
          this.loading = false;
        },
        error: () => (this.loading = false),
      });
    } else {
      this.productApi.update(this.editingProduct!.id, fd).subscribe({
        next: updated => {
          this.products = this.products.map(p => (p.id === updated.id ? updated : p));
          this.resetForm();
          this.loading = false;
        },
        error: () => (this.loading = false),
      });
    }
  }
}
