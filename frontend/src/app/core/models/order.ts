export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  product: {
    id: number;
    title: string;
    thumbnail_url?: string;
  };
}

export interface Order {
  id: number;
  customer_id: number;
  shipping_name: string;
  shipping_street: string;
  shipping_city: string;
  shipping_zip: string;
  status: 'processing' | 'completed' | 'cancelled';
  total: number;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
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

export interface OrderResponse {
  pagy: PagyData;
  orders: Order[];
}
