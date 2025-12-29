export interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  vendor: number;
  category: number;
  description: string;
  price: string;   // keep as string since API returns "100.00"
  unit: number;
  stock: number;
  image: string;
  product_type: string;
  created_at: string;
  updated_at: string;
  images: any[];   // could refine if you have image model
  detail: string | null;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
