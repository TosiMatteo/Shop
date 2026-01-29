import {Component, inject} from '@angular/core';
import {ProductCardComponent} from '../product-card/product-card';
import {ProductApi} from '../../../core/services/product';
import {FormsModule} from '@angular/forms';
import {MatFormField} from '@angular/material/form-field';
import {MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {AsyncPipe} from '@angular/common';
import {BehaviorSubject, combineLatest, debounceTime, distinctUntilChanged, map, startWith} from 'rxjs';
import {Product} from '../../../core/models/product';
import {MatOption} from '@angular/material/core';
import {MatSelect} from '@angular/material/select';
import {MatPaginator, PageEvent} from '@angular/material/paginator';

type Sort = 'dateAsc' | 'dateDesc' | 'priceAsc' | 'priceDesc';
const cmp = (s:Sort)=>(a:Product,b:Product)=>
  s==='priceAsc'? a.price-b.price :
    s==='priceDesc'? b.price-a.price :
      s==='dateAsc'? a.created_at.localeCompare(b.created_at) :
        b.created_at.localeCompare(a.created_at);


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
    MatPaginator
  ],
  templateUrl: './product-page.html',
  styleUrl: './product-page.scss',
})

export class ProductPage {
  private service = inject(ProductApi);
  products$ = this.service.list();

  private filters$ = new BehaviorSubject({
    title:'',
    sort:'dateDesc' as Sort,
    priceFilter:{min:0,max:Number.POSITIVE_INFINITY}
  });


  private title$ = this.filters$.pipe(map(f => f.title),
    debounceTime(250),
    distinctUntilChanged(),
    startWith(this.filters$.value.title));

  filteredProducts$ = combineLatest([
    this.products$,
    this.filters$,
    this.title$
  ]).pipe(map(([products, filters, title]) => products.filter(products => {
    const matchesTitle =
      !title ||
      products.title.toLowerCase().includes(title.toLowerCase());
    const matchesPrice =
      products.price >= filters.priceFilter.min &&
      products.price <= filters.priceFilter.max;
    return matchesTitle && matchesPrice;
  }).toSorted(cmp(filters.sort))));

  page$ = new BehaviorSubject(1);
  pageSize = 6;
  paged$ = combineLatest([this.filteredProducts$, this.page$]).pipe(
    map(([items, page]) => {
      const start = (page-1)*this.pageSize;
      return items.slice(start, start+this.pageSize);
    })
  );
  onPage = (e:PageEvent)=>this.page$.next(e.pageIndex+1);

  updateTitle(title:string) {
    this.filters$.next(
      {...this.filters$.value,
      title:title}
    );
  };

  onAdd(product: any) {
    console.log('Aggiunto al carrello',product)
  }

  protected updateSort(sort: Sort) {
    this.filters$.next(
      {...this.filters$.value,
      sort:sort
      }
    )
  }

  protected updatePriceMin(value:any) {
    const min = this.parsePrice(value, 0);
    this.filters$.next(
      {...this.filters$.value,
      priceFilter:{min:min,max:this.filters$.value.priceFilter.max}
      }
    )
  }

  protected updatePriceMax(value:any) {
    const max = this.parsePrice(value, Number.POSITIVE_INFINITY);
    this.filters$.next(
      {...this.filters$.value,
      priceFilter:{min:this.filters$.value.priceFilter.min,max:max}
      }
    )
  }

  private parsePrice(value:any, fallback:number) {
    if (value === '' || value === null || value === undefined) {
      return fallback;
    }
    if (typeof value === 'string' && value.trim() === '') {
      return fallback;
    }
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }
}
