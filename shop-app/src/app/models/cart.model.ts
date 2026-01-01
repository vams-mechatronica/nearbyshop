export interface Product {
  id: number;
  name: string;
  price: string;
  image: string;
}

export interface CartItem {
  find(arg0: (p: any) => boolean): unknown;
  filter(arg0: (p: any) => boolean): CartItem;
  id: number;
  product: Product;
  quantity: number;
  price: string; 
}

export interface CartFullResponse {
  items: CartItem[];
  total: number;
  total_discount: number;
  total_price_after_discount: number;
  total_price_before_discount: number;
  user: number;
  id: number;
}

export interface CartResponse {
   items: CartItem[];
  total: number;}