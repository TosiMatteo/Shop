import {Component, inject} from '@angular/core';
import {ProductCardComponent} from '../product-card/product-card';
import {ProductApi} from '../../../core/services/product-service';
import {FormsModule} from '@angular/forms';
import {MatFormField} from '@angular/material/form-field';
import {MatLabel} from '@angular/material/form-field';
import {MatInput} from '@angular/material/input';
import {AsyncPipe} from '@angular/common';
import {
  BehaviorSubject,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  map,
  shareReplay,
  startWith,
  switchMap
} from 'rxjs';
import {Product} from '../../../core/models/product';
import {MatOption} from '@angular/material/core';
import {MatSelect} from '@angular/material/select';
import {MatPaginator, PageEvent} from '@angular/material/paginator';
import {TagService} from '../../../core/services/tag-service';
import {MatSlideToggle} from '@angular/material/slide-toggle';
import {MatIcon} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';

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
    MatPaginator,
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
    priceFilter:{min:0,max:Number.POSITIVE_INFINITY},
    saleFilter:false,
    tag: null as string | null
  });


  private title$ = this.filters$.pipe(map(f => f.title),
    debounceTime(250),
    distinctUntilChanged(),
    startWith(this.filters$.value.title));

  // 2. LOGICA IBRIDA (Server + Client)
  // Questa stream gestisce il recupero dati dal SERVER
  // Si attiva solo quando cambia il TAG.
  private serverProducts$ = this.filters$.pipe(
    map(f => f.tag),           // Prendiamo solo il campo tag
    distinctUntilChanged(),    // Se cambio prezzo/titolo, NON rifare la chiamata API
    switchMap(tag =>           // Chiama il backend
      this.product_service.list(tag)
    ),
    shareReplay(1) // Evita chiamate doppie se ci sono più subscribe
  );

  filteredProducts$ = combineLatest([
    this.serverProducts$,
    this.filters$,
    this.title$
  ]).pipe(map(([products, filters, title]) => products.filter(products => {
    const matchesTitle =
      !title ||
      products.title.toLowerCase().includes(title.toLowerCase());
    const matchesPrice =
      products.price >= filters.priceFilter.min &&
      products.price <= filters.priceFilter.max;
    const matchesSale = !filters.saleFilter || products.sale;
    return matchesTitle && matchesPrice && matchesSale;
  }).toSorted(cmp(filters.sort))));

  page$ = new BehaviorSubject(1);
  pageSize = 9;
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

  protected updateSale(value: boolean) {
    this.filters$.next(
      {...this.filters$.value,
        saleFilter: value
      }
    )
  }

  protected updateTags(tag: string | null) {
    this.filters$.next({
      ...this.filters$.value,
      tag: tag
    });
    // Resettiamo la paginazione alla pagina 1 quando si filtra
    this.page$.next(1);
  }

  resetTag(event: Event, select: MatSelect) {
    // 1. Ferma la propagazione per non aprire il menu a tendina quando clicchi la X
    event.stopPropagation();
    // 2. Resetta il valore visivo della select
    select.value = null;
    // 3. Aggiorna la logica dei filtri
    this.updateTags(null);
  }
}
