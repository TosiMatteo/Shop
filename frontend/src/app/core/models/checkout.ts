export interface ShippingParams {
  name: string;
  street: string;
  city: string;
  zip: string;
}

export interface CheckoutResponse {
  id: number;
  total: string;
  status: string;
  shipping_name: string;
  order_items: number;
}
