import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { StorageService } from './storage.service';
import { map, Observable, of, tap } from 'rxjs';
import { API_ENDPOINTS } from '../shared/constants/api.constants';
import { ApiResponse } from '../models/api-response.model';
import { Shop, ShopProfileResponse, ShopStats } from '../models/vendor.model';
import { environment } from '../../environments/environment';
import { PaginatedResponse, ProductFilter } from '../models/product.model';
import { RatingDistribution, Review, ReviewRequest } from '../models/review.model';
import { Category, ShopCategoriesResponse } from '../models/category.model';
interface Product {
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
@Injectable({ providedIn: 'root' })
export class ShopService {
  private apiUrl = `${environment.apiUrl}/vendors`;


  constructor(private http: HttpClient, private storage: StorageService) { }

  getShopDetails(slug: string): Observable<any> {
    return this.http.get(API_ENDPOINTS.STORE_DETAILS + slug + '/');
  }

  getShopList(): Observable<any> {
    return this.http.get(API_ENDPOINTS.STORES_WITH_PINCODE_V2);
  }

  getShopListWithFilter(filters: any): Observable<any> {
    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (
        value !== null &&
        value !== undefined &&
        value !== '' &&
        value !== false
      ) {
        params = params.set(key, value);
      }
    });
    return this.http.get(API_ENDPOINTS.STORES_V2, { params });
  }
  // Shop Profile Methods
  getShopById(vendorId: number): Observable<Shop> {
    return this.http.get<ApiResponse<Shop>>(`${this.apiUrl}/${vendorId}`)
      .pipe(map(response => response.data));
  }

  getShopBySlug(vendorSlug: string): Observable<Shop> {
    return this.http.get<Shop>(`${API_ENDPOINTS.SHOP}/${vendorSlug}/`);
  }

  getShopProfile(vendorId: number): Observable<ShopProfileResponse> {
    return this.http.get<ApiResponse<ShopProfileResponse>>(
      `${this.apiUrl}/${vendorId}/profile`
    ).pipe(map(response => response.data));
  }

  getShopStats(vendorId: number): Observable<ShopStats> {
    return this.http.get<ApiResponse<ShopStats>>(
      `${this.apiUrl}/${vendorId}/stats`
    ).pipe(map(response => response.data));
  }

  updateShop(vendorId: number, vendorData: Partial<Shop>): Observable<Shop> {
    return this.http.put<ApiResponse<Shop>>(
      `${this.apiUrl}/${vendorId}`,
      vendorData
    ).pipe(map(response => response.data));
  }

  // Favorites Methods
  checkIfFavorite(vendorId: number): Observable<boolean> {
    return this.http.get<ApiResponse<{ isFavorite: boolean }>>(
      `${this.apiUrl}/${vendorId}/favorite`
    ).pipe(
      map(response => response.data.isFavorite)
    );
  }

  addToFavorites(vendorId: number): Observable<void> {
    return this.http.post<ApiResponse<void>>(
      `${this.apiUrl}/${vendorId}/favorite`,
      {}
    ).pipe(map(() => { }));
  }

  removeFromFavorites(vendorId: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/${vendorId}/favorite`
    ).pipe(map(() => { }));
  }

  getFavoriteShops(): Observable<Shop[]> {
    return this.http.get<ApiResponse<Shop[]>>(`${this.apiUrl}/favorites`)
      .pipe(map(response => response.data));
  }

  // Shop Products Methods
  getShopProducts(shopSlug: string, filter?: ProductFilter): Observable<Product[]> {
    let params = new HttpParams();

    if (filter) {
      if (filter.categoryId) params = params.set('category', filter.categoryId.toString());
      if (filter.minPrice) params = params.set('minPrice', filter.minPrice.toString());
      if (filter.maxPrice) params = params.set('maxPrice', filter.maxPrice.toString());
      if (filter.inStock !== undefined) params = params.set('inStock', filter.inStock.toString());
      if (filter.sortBy) params = params.set('sortBy', filter.sortBy);
      if (filter.search) params = params.set('search', filter.search);
    }

    return this.http.get<PaginatedResponse<Product>>(
      `${API_ENDPOINTS.SHOP}/${shopSlug}/products`,
      { params }
    ).pipe(map(response => response.results));
  }

  getShopProductCategories(vendorId: string): Observable<Category[]> {
    return this.http.get<ShopCategoriesResponse>(
      `${API_ENDPOINTS.SHOP}/${vendorId}/products/categories/`
    ).pipe(
      map(response => response.categories ?? []));
  }

  // Reviews Methods
  getShopReviews(vendorId: number, page = 1, limit = 10): Observable<Review[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<ApiResponse<Review[]>>(
      `${this.apiUrl}/${vendorId}/reviews`,
      { params }
    ).pipe(map(response => response.data));
  }

  getRatingDistribution(vendorId: number): Observable<RatingDistribution[]> {
    return this.http.get<ApiResponse<RatingDistribution[]>>(
      `${this.apiUrl}/${vendorId}/reviews/distribution`
    ).pipe(map(response => response.data));
  }

  addReview(vendorId: number, review: ReviewRequest): Observable<Review> {
    const formData = new FormData();
    formData.append('rating', review.rating.toString());
    formData.append('comment', review.comment);

    if (review.productId) {
      formData.append('productId', review.productId.toString());
    }

    if (review.images) {
      review.images.forEach((image, index) => {
        formData.append(`images[${index}]`, image);
      });
    }

    return this.http.post<ApiResponse<Review>>(
      `${this.apiUrl}/${vendorId}/reviews`,
      formData
    ).pipe(map(response => response.data));
  }

  markReviewHelpful(reviewId: number): Observable<void> {
    return this.http.post<ApiResponse<void>>(
      `${this.apiUrl}/reviews/${reviewId}/helpful`,
      {}
    ).pipe(map(() => { }));
  }

  // Search and Filter Shops
  searchShops(searchTerm: string, filters?: any): Observable<Shop[]> {
    let params = new HttpParams().set('search', searchTerm);

    if (filters) {
      if (filters.minRating) params = params.set('minRating', filters.minRating.toString());
      if (filters.maxDistance) params = params.set('maxDistance', filters.maxDistance.toString());
      if (filters.categoryId) params = params.set('categoryId', filters.categoryId.toString());
      if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
    }

    return this.http.get<ApiResponse<Shop[]>>(`${this.apiUrl}/search`, { params })
      .pipe(map(response => response.data));
  }

  getNearbyShops(latitude: number, longitude: number, radius = 5): Observable<Shop[]> {
    const params = new HttpParams()
      .set('lat', latitude.toString())
      .set('lng', longitude.toString())
      .set('radius', radius.toString());

    return this.http.get<ApiResponse<Shop[]>>(`${this.apiUrl}/nearby`, { params })
      .pipe(map(response => response.data));
  }

  // Analytics and Reporting
  getShopAnalytics(vendorId: number, period: 'day' | 'week' | 'month' | 'year'): Observable<any> {
    return this.http.get<ApiResponse<any>>(
      `${this.apiUrl}/${vendorId}/analytics`,
      { params: { period } }
    ).pipe(map(response => response.data));
  }

  // Share and Referral
  generateShareLink(vendorId: number): Observable<{ shareUrl: string, referralCode?: string }> {
    return this.http.post<ApiResponse<{ shareUrl: string, referralCode?: string }>>(
      `${this.apiUrl}/${vendorId}/share-link`,
      {}
    ).pipe(map(response => response.data));
  }

  // Verification
  requestVerification(vendorId: number, documents: File[]): Observable<void> {
    const formData = new FormData();
    documents.forEach((doc, index) => {
      formData.append(`documents[${index}]`, doc);
    });

    return this.http.post<ApiResponse<void>>(
      `${this.apiUrl}/${vendorId}/request-verification`,
      formData
    ).pipe(map(() => { }));
  }

  // Shop Registration
  registerShop(vendorData: any): Observable<Shop> {
    return this.http.post<ApiResponse<Shop>>(`${this.apiUrl}/register`, vendorData)
      .pipe(map(response => response.data));
  }

  // Shop Hours Update
  updateStoreHours(vendorId: number, storeHours: any[]): Observable<void> {
    return this.http.put<ApiResponse<void>>(
      `${this.apiUrl}/${vendorId}/store-hours`,
      { storeHours }
    ).pipe(map(() => { }));
  }

  // Shop Availability
  updateShopAvailability(vendorId: number, isAvailable: boolean): Observable<void> {
    return this.http.put<ApiResponse<void>>(
      `${this.apiUrl}/${vendorId}/availability`,
      { isAvailable }
    ).pipe(map(() => { }));
  }
}

