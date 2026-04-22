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
import {AuthService} from '../../../core/services/auth/auth-service';

type Sort = 'dateAsc' | 'dateDesc' | 'totalAsc' | 'totalDesc';
type Status = 'processing' | 'completed' | 'cancelled';

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
  private authService = inject(AuthService)

  // Last 5 years used by year filter select.
  protected availableYears: number[] = this.buildYearList();

  protected statusOptions: { value: Status; label: string }[] = [
    { value: 'processing', label: 'In elaborazione' },
    { value: 'completed',  label: 'Completato' },
    { value: 'cancelled',  label: 'Annullato' },
  ];

  protected filters$ = new BehaviorSubject({
    totalFilter: { min: null as number | null, max: null as number | null },
    sort: 'dateDesc' as Sort,
    status: null as Status | null,
    year: null as number | null,
    page: 1,
    limit: 10,
  });

  // Raw text streams for debounced min/max inputs.
  private minInput$ = new Subject<string>();
  private maxInput$ = new Subject<string>();

  // Single request pipeline driven by current filters.
  private response$ = this.filters$.pipe(
    switchMap(filters =>
      this.orderService.list({
        min: filters.totalFilter.min,
        max: filters.totalFilter.max,
        sort: filters.sort,
        status: filters.status,
        year: filters.year,
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
      // Reset to first page whenever a filter changes.
      const min = value ? +value : null;
      const totalFilter = { ...this.filters$.value.totalFilter, min };
      this.filters$.next({ ...this.filters$.value, totalFilter, page: 1 });
    });

    this.maxInput$.pipe(
      debounceTime(400),
      takeUntilDestroyed()
    ).subscribe((value: string | number) => {
      // Reset to first page whenever a filter changes.
      const max = value ? +value : null;
      const totalFilter = { ...this.filters$.value.totalFilter, max };
      this.filters$.next({ ...this.filters$.value, totalFilter, page: 1 });
    });
  }

  protected updateSort(sort: Sort): void {
    this.filters$.next({ ...this.filters$.value, sort, page: 1 });
  }

  protected updateMinTotal(value: string): void {
    this.minInput$.next(value);
  }

  protected updateMaxTotal(value: string): void {
    this.maxInput$.next(value);
  }

  protected updateStatus(status: Status | null): void {
    this.filters$.next({ ...this.filters$.value, status, page: 1 });
  }

  protected updateYear(year: number | null): void {
    this.filters$.next({ ...this.filters$.value, year, page: 1 });
  }

  protected onPage(event: PageEvent): void {
    // Angular paginator is zero-based; backend pagination is one-based.
    this.filters$.next({
      ...this.filters$.value,
      page: event.pageIndex + 1,
      limit: event.pageSize,
    });
  }

  private buildYearList(): number[] {
    const current     = new Date().getFullYear();
    const memberSince = this.authService.getMemberSince() ?? current - 4;
    return Array.from({ length: current - memberSince + 1 }, (_, i) => current - i);
  }
}
