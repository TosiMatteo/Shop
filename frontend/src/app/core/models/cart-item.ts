import { Product } from './product';
export interface CartItem {
  id: number,
  cartId: number,
  productId: number,
  quantity: number,
  product: Product;
}
