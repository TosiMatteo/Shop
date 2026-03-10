import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { OrderResponse } from '../../models/order';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly orderUrl = '/api/orders';

  constructor(private readonly http: HttpClient) {}

  list(filters: {
    min?: number | null;
    max?: number | null;
    sort?: string | null;
    page?: number;
    limit?: number;
  }): Observable<OrderResponse> {
    let params = new HttpParams();

    if (filters.min != null) params = params.set('min', filters.min.toString());
    if (filters.max != null) params = params.set('max', filters.max.toString());
    if (filters.sort)        params = params.set('sort', filters.sort);
    if (filters.page)        params = params.set('page', filters.page.toString());
    if (filters.limit)       params = params.set('limit', filters.limit.toString());

    return this.http.get<OrderResponse>(this.orderUrl, { params });
  }
}
