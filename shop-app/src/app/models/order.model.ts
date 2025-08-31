export interface Address {
  id: number;
  name: string;
  address_line: string;
  city: string;
  state: string;
  zip_code: string;
  phone_number: string;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
  user: number;
}

export interface OrderItem {
  id: number;
  product: string;
  product_image: string;
  quantity: number;
  price: string; // keep as string since API returns "100.00"
}

export interface Order {
  id: number;
  user: number;
  total_price: string; // "100.00"
  coupon: string | null;
  address: Address;
  payment_method: "razorpay" | "cod" | string; // extend if more methods exist
  payment: any | null; // replace with a payment interface if you have one
  status: "pending" | "completed" | "cancelled" | string; // extend based on choices
  created_at: string; // ISO datetime string
  items: OrderItem[];
}
