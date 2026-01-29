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
