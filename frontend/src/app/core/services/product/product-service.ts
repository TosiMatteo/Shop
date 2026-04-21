import { Injectable } from '@angular/core';
import {Observable} from 'rxjs';
import {Product, ProductsResponse} from '../../models/product';
import {HttpClient, HttpParams} from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ProductApi {
  private readonly url = '/api/products';

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
    // Include only active filters so backend receives a clean query string.
    let params = new HttpParams();

    if (filters.tag)         params = params.set('tag', filters.tag);
    if (filters.title)       params = params.set('title', filters.title);
    if (filters.min != null) params = params.set('min', filters.min.toString());
    if (filters.max != null) params = params.set('max', filters.max.toString());
    if (filters.sale)        params = params.set('sale', 'true');
    if (filters.sort)        params = params.set('sort', filters.sort);
    if (filters.page)        params = params.set('page', filters.page.toString());
    if (filters.limit)       params = params.set('limit', filters.limit.toString());

    // Returns paginated/filtered products.
    return this.http.get<ProductsResponse>(this.url, { params });
  }

  // Create a product (multipart/form-data supports image upload).
  create(product: FormData): Observable<any> {
    return this.http.post(this.url, product);
  }

  // Update an existing product using multipart payload.
  update(id: string, product: FormData): Observable<Product>{
    return this.http.patch<Product>(`${this.url}/${id}`, product);
  }

  // Delete product by id.
  delete(id: string): Observable<any> {
    return this.http.delete(`${this.url}/${id}`);
  }
}
