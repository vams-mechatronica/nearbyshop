export interface vProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  categoryId: number;
  unit: string;
  inCart: number;
  isWishlisted: boolean;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  seo_image: string;  
  shop: number;
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

export interface NutritionalInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
}

export interface ProductFilter {
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest';
  search?: string;
}