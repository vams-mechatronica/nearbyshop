export interface Category {
  id: number;
  name: string;
  image?: string;
  description?: string;
  slug: string;
  category_type: string;
  is_active: boolean;
}
export interface ShopCategoriesResponse {
  shop_id: number;
  shop_name: string;
  shop_slug: string;
  categories: Category[];
  total_categories: number;
}
