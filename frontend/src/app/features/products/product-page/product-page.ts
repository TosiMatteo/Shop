import {Component, inject} from '@angular/core';
import {ProductCardComponent} from '../product-card/product-card';
import {ProductApi} from '../../../core/services/product-service';
import {FormsModule} from '@angular/forms';
import {MatFormField} from '@angular/material/form-field';
import {MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {AsyncPipe} from '@angular/common';
import {
  BehaviorSubject, combineLatest,
  debounceTime,
  distinctUntilChanged,
  map,
  shareReplay,
  switchMap
} from 'rxjs';
import {MatOption} from '@angular/material/core';
import {MatSelect} from '@angular/material/select';
import {MatPaginator, MatPaginatorModule, PageEvent} from '@angular/material/paginator';
import {TagService} from '../../../core/services/tag-service';
import {MatSlideToggle} from '@angular/material/slide-toggle';
import {MatIcon} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';

type Sort = 'dateAsc' | 'dateDesc' | 'priceAsc' | 'priceDesc';

@Component({
  selector: 'app-product-page',
  imports: [
    ProductCardComponent,
    FormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    AsyncPipe,
    MatSelect,
    MatOption,
    MatOption,
    MatPaginatorModule,
    MatSlideToggle,
    MatIcon,
    MatIconButton
  ],
  templateUrl: './product-page.html',
  styleUrl: './product-page.scss',
})

export class ProductPage {
  private product_service = inject(ProductApi);
  private tag_service = inject(TagService);
  tags$ = this.tag_service.list();

  protected filters$ = new BehaviorSubject({
    title:'',
    sort:'dateDesc' as Sort,
    priceFilter:{min: null as number | null, max: null as number | null },
    saleFilter:false,
    tag: null as string | null,
    page: 1,
    limit: 10
  });

  private titleDebounced$ = this.filters$.pipe(
    map(f => f.title),
    debounceTime(300),
    distinctUntilChanged()
  );


  private response$ = combineLatest([
    this.filters$,
    this.titleDebounced$
  ]).pipe(
    map(([filters, title]) => ({ ...filters, title })),
    switchMap(filters =>
      this.product_service.list({
        tag: filters.tag,
        title: filters.title,
        min: filters.priceFilter.min,
        max: filters.priceFilter.max,
        sale: filters.saleFilter || null,
        sort: filters.sort,
        page: filters.page,
        limit: filters.limit
      })
    ),
    shareReplay(1)
  );


  products$ = this.response$.pipe(map(r => r.products));
  pagy$ = this.response$.pipe(map(r => r.pagy));

  // Event handlers
  onPage(e: PageEvent) {
    this.filters$.next({
      ...this.filters$.value,
      page: e.pageIndex + 1,
      limit: e.pageSize
    });
  }

  updateTitle(title: string) {
    this.filters$.next({
      ...this.filters$.value,
      title: title,
      page: 1
    });
  }

  updateSort(sort: Sort) {
    this.filters$.next({
      ...this.filters$.value,
      sort: sort,
      page: 1
    });
  }

  updatePriceMin(value: any) {
    const min = this.parsePrice(value, null);
    this.filters$.next({
      ...this.filters$.value,
      priceFilter: { ...this.filters$.value.priceFilter, min },
      page: 1
    });
  }

  updatePriceMax(value: any) {
    const max = this.parsePrice(value, null);
    this.filters$.next({
      ...this.filters$.value,
      priceFilter: { ...this.filters$.value.priceFilter, max },
      page: 1
    });
  }

  private parsePrice(value: any, fallback: number | null): number | null {
    if (value === '' || value === null || value === undefined) {
      return fallback;
    }
    if (typeof value === 'string' && value.trim() === '') {
      return fallback;
    }
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  updateSale(value: boolean) {
    this.filters$.next({
      ...this.filters$.value,
      saleFilter: value,
      page: 1
    });
  }

  updateTags(tag: string | null) {
    this.filters$.next({
      ...this.filters$.value,
      tag: tag,
      page: 1
    });
  }

  resetTag(event: Event, select: MatSelect) {
    event.stopPropagation();
    select.value = null;
    this.updateTags(null);
  }

  onAdd(product: any) {
    console.log('Aggiunto al carrello', product);
  }
}
