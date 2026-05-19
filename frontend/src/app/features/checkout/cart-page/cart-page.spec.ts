import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CartPageComponent } from './cart-page';
import {provideRouter} from '@angular/router';
import {provideHttpClient} from '@angular/common/http';

describe('CartPage', () => {
  let component: CartPageComponent;
  let fixture: ComponentFixture<CartPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartPageComponent],
      providers:[
        provideRouter([]),
        provideHttpClient(),
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CartPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
