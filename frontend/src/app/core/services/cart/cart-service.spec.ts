import { TestBed } from '@angular/core/testing';
import { CartService } from './cart-service';
import {provideHttpClient} from '@angular/common/http';

describe('CartService', () => {
  let service: CartService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()],
    });
    service = TestBed.inject(CartService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
