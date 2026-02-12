import { Product } from "./product.model";
import { RatingDistribution, Review } from "./review.model";

// vendor.model.ts
export interface Shop {
  id: number;
  name: string;
  slug: string;
  shop_image: string;
  category: number | null;
  is_accepting_orders: boolean;
  created_at: string;
  updated_at: string;
  
  // Derived/sample fields
  tagline: string;
  description: string;
  cover_image?: string;
  address: Address;
  delivery_time_min: number;
  delivery_time_max: number;
  delivery_fee: number;
  minimum_order: number;
  free_delivery_threshold: number;
  is_featured: boolean;
  rating: number;
  review_count: number;
  total_orders: number;
  response_rate: number;
  delivery_success_rate: number;
  
  // Relations
  categories: Category[];
  store_hours: StoreHour[];
  
  // Flags
  is_favorite?: boolean;
  distance?: number;
  
  // Vendor info
  vendor_name: string;
  vendor_is_verified: boolean;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  full_address: string;
}

export interface StoreHour {
  day: number;
  day_name: string;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

export interface Category {
  id: number;
  name: string;
  icon?: string;
  productCount?: number;
  image?: string;
}

export interface ShopListResponse {
  shops: ShopListItem[];
  count: number;
  next?: string;
  previous?: string;
}

export interface ShopListItem {
  id: number;
  name: string;
  slug: string;
  shopImage: string;
  category: number;
  categoryName: string;
  isAcceptingOrders: boolean;
  
  // Sample fields for list view
  tagline: string;
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  deliveryFee: number;
  minimumOrder: number;
  freeDeliveryThreshold: number;
  isFeatured: boolean;
  rating: number;
  
  // Flags
  isFavorite: boolean;
  distance?: number;
}

export interface ShopProfileResponse {
  shop: Shop;
  vendor: VendorInfo;
  products: Product[];
  reviews: Review[];
  ratingDistribution: RatingDistribution[];
  stats: ShopStats;
}

export interface VendorInfo {
  id: number;
  businessName: string;
  isVerified: boolean;
  phoneNumber?: string;
  email?: string;
}

export interface ShopStats {
  totalProducts: number;
  totalOrders: number;
  averageRating: number;
  responseRate: number;
  deliverySuccessRate: number;
  dailySales?: number;
  weeklySales?: number;
  monthlySales?: number;
  totalCustomers?: number;
  averageOrderValue?: number;
  conversionRate?: number;
  pendingOrders?: number;
  cancelledOrders?: number;
}

export interface FavoriteShop {
  id: number;
  shop: ShopListItem;
  createdAt: string;
}

export interface ShopAvailability {
  status: string;
  isOnline: boolean;
  shopId: number;
  shopName: string;
}

// Keep Vendor interface for backward compatibility or for vendor-specific views
export interface Vendor {
  id: number;
  businessName: string;
  isVerified: boolean;
  contactNumber?: string;
  email?: string;
  shops?: ShopListItem[];
}