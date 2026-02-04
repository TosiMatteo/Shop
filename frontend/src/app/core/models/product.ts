export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  original_price: number;
  sale: boolean;
  thumbnail_url?: string;
  tags?: string[];
  created_at: string;
}

export interface PagyData {
  page: number;
  count: number;
  limit: number;
  last: number;
  from: number;
  to: number;
  prev: number | null;
  next: number | null;
}

export interface ProductsResponse {
  pagy: PagyData;
  products: Product[];
}
