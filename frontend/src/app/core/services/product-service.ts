import { Injectable } from '@angular/core';
import {Observable} from 'rxjs';
import {Product} from '../models/product';
import {HttpClient, HttpParams} from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ProductApi {
  private readonly url = 'http://localhost:3000/products';

  constructor(private readonly  http: HttpClient) {}

  // Accetta un tag opzionale (stringa o null)
  list(tag?: string | null): Observable<Product[]>{
    let params = new HttpParams();

    // Se c'è un tag, lo aggiunge all'URL: /products?tag=Valore
    if (tag) {
      params = params.set('tag', tag);
    }

    return this.http.get<Product[]>(this.url, { params });
  }
}
