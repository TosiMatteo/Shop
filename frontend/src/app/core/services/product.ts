import { Injectable } from '@angular/core';
import {Observable} from 'rxjs';
import {Product} from '../models/product';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ProductApi {
  private readonly url = 'http://localhost:3000/products';

  constructor(private readonly  http: HttpClient) {}

  list(): Observable<Product[]>{
    return this.http.get<Product[]>(`${this.url}`);
  }
}
