import {inject, Injectable} from '@angular/core';
import {map} from 'rxjs';
import {ProductApi} from './product-service';

@Injectable({
  providedIn: 'root',
})
export class CartService {

  product$ = inject(ProductApi);

  list(){
    return this.product$.list().pipe(
      //primi 5
      map(products=>products.slice(0,5))
    )
  }

}
