import { Product } from './product.model';

export interface Subscription {
  id: number;
  product: Product;
  start_date: string;         // e.g. "2025-08-29"
  end_date: string;           // e.g. "2026-08-30"
  frequency: 'daily' | 'weekly' | 'monthly' | string;
  status: 'active' | 'inactive' | 'cancelled' | string;
  last_renewed: string;
  next_renewal_date: string | null;
  quantity: number;
  price: string;              // "0.00"
  remarks: string;
  created_at: string;
  updated_at: string;
  eligible_for_delivery: boolean;
  user: number;
}


export interface SubscriptionResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Subscription[];
}
