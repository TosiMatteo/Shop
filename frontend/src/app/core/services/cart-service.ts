import {inject, Injectable} from '@angular/core';
import {map} from 'rxjs';
import {ProductApi} from './product-service';

@Injectable({
  providedIn: 'root',
})
export class CartService {

  product$ = inject(ProductApi);

  list(){
    // 1. Passa un oggetto vuoto {} per soddisfare l'argomento mancante (TS2554)
    return this.product$.list({}).pipe(
      // 2. La risposta ora è un oggetto { data: [...], total: ... }
      // Usiamo 'any' per dire a TypeScript "fidati di me" ed estraiamo .data
      map((response: any) => {
        // Se response.data esiste usa quello, altrimenti array vuoto (per sicurezza)
        const products = response.data || [];
        return products.slice(0, 5);
      })
    )
  }

}
