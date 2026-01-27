import {Product} from './product';

export interface Order {
  customer: unknown;
  address: unknown;
  items: Product[];
  total: number;
  createdAt: string;
}
