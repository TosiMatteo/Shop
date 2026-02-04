import { Injectable } from '@angular/core';
import {Observable} from 'rxjs';
import {ProductsResponse} from '../models/product';
import {HttpClient, HttpParams} from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ProductApi {
  private readonly url = 'http://localhost:3000/products';

  constructor(private readonly http: HttpClient) {}

  list(filters: {
    tag?: string | null;
    title?: string | null;
    min?: number | null;
    max?: number | null;
    sale?: boolean | null;
    sort?: string | null;
    page?: number;
    limit?: number;
  }): Observable<ProductsResponse> {
    let params = new HttpParams();

    if (filters.tag) params = params.set('tag', filters.tag);
    if (filters.title) params = params.set('title', filters.title);
    if (filters.min !== null && filters.min !== undefined) {
      params = params.set('min', filters.min.toString());
    }
    if (filters.max !== null && filters.max !== undefined) {
      params = params.set('max', filters.max.toString());
    }
    if (filters.sale) params = params.set('sale', 'true');
    if (filters.sort) params = params.set('sort', filters.sort);
    if (filters.page) params = params.set('page', filters.page.toString());
    if (filters.limit) params = params.set('limit', filters.limit.toString());

    return this.http.get<ProductsResponse>(this.url, { params });
  }
}
