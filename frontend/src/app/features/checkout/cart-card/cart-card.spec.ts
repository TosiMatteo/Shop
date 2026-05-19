import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CartCardComponent } from './cart-card';
import {provideRouter} from '@angular/router';
import {provideHttpClient} from '@angular/common/http';

describe('CartCard', () => {
  let component: CartCardComponent;
  let fixture: ComponentFixture<CartCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartCardComponent],
      providers:[
        provideRouter([]),
        provideHttpClient(),
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CartCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
