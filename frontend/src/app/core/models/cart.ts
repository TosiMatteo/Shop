import { CartItem } from './cart-item';

export interface Cart {
  id: number;
  items: CartItem[];
  customerId: number;
  total_price: number;
}
