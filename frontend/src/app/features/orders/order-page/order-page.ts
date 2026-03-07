import {Component, inject} from '@angular/core';
import {OrderService} from '../../../core/services/order/order-service';
import {BehaviorSubject, debounceTime, map, shareReplay, Subject, switchMap} from 'rxjs';
import {FormsModule} from '@angular/forms';
import {MatPaginatorModule, PageEvent} from '@angular/material/paginator';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatSelectModule} from '@angular/material/select';
import {MatInputModule} from '@angular/material/input';
import {OrderCard} from '../order-card/order-card';
import {AsyncPipe} from '@angular/common';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

type Sort = 'dateAsc' | 'dateDesc' | 'totalAsc' | 'totalDesc';

@Component({
  selector: 'app-order-page',
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatPaginatorModule,
    OrderCard,
    AsyncPipe,
  ],
  templateUrl: './order-page.html',
  styleUrl: './order-page.scss',
})
export class OrderPage {
  private orderService = inject(OrderService);

  protected filters$ = new BehaviorSubject({
    totalFilter: { min: null as number | null, max: null as number | null },
    sort: 'dateDesc' as Sort,
    page: 1,
    limit: 10,
  });

  // Subject dedicati per il debounce degli input testuali min/max.
  // Senza di essi ogni tasto scatena una chiamata HTTP.
  private minInput$ = new Subject<string>();
  private maxInput$ = new Subject<string>();

  // shareReplay(1): un solo HTTP call condiviso tra tutti i subscriber (orders$, pagy$).
  // Senza shareReplay ogni pipe separata attiva il proprio switchMap → double firing.
  private response$ = this.filters$.pipe(
    switchMap(filters =>
      this.orderService.list({
        min: filters.totalFilter.min,
        max: filters.totalFilter.max,
        sort: filters.sort,
        page: filters.page,
        limit: filters.limit,
      })
    ),
    shareReplay(1)
  );

  protected orders$ = this.response$.pipe(map(r => r.orders));
  protected pagy$   = this.response$.pipe(map(r => r.pagy));

  constructor() {
    this.minInput$.pipe(
      debounceTime(400),
      takeUntilDestroyed()
    ).subscribe((value: string | number) => {
      const min = value ? +value : null;
      const totalFilter = { ...this.filters$.value.totalFilter, min };
      this.filters$.next({ ...this.filters$.value, totalFilter, page: 1 });
    });

    this.maxInput$.pipe(
      debounceTime(400),
      takeUntilDestroyed()
    ).subscribe((value: string | number) => {
      const max = value ? +value : null;
      const totalFilter = { ...this.filters$.value.totalFilter, max };
      this.filters$.next({ ...this.filters$.value, totalFilter, page: 1 });
    });
  }

  protected updateSort(sort: Sort): void {
    this.filters$.next({ ...this.filters$.value, sort, page: 1 });
  }

  // I metodi alimentano il Subject — il debounce è gestito nella subscription in costruttore
  protected updateMinTotal(value: string): void {
    this.minInput$.next(value);
  }

  protected updateMaxTotal(value: string): void {
    this.maxInput$.next(value);
  }

  protected onPage(event: PageEvent): void {
    this.filters$.next({
      ...this.filters$.value,
      page: event.pageIndex + 1,
      limit: event.pageSize,
    });
  }
}
