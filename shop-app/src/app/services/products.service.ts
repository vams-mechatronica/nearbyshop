import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../shared/constants/api.constants';

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  constructor(private http: HttpClient) {}

  getProducts(): Observable<any> {
    // const params = new HttpParams().set('category', category.toString());
    return this.http.get(API_ENDPOINTS.PRODUCTS);
  }

  getProductsByCategorySlug(slug: string): Observable<any> {
    const params = new HttpParams().set('category__slug', slug);
    return this.http.get(API_ENDPOINTS.PRODUCTS, { params });
  }
  getProductsByStoreSlug(slug: string): Observable<any> {
    // const params = new HttpParams().set('store__slug', slug);
    return this.http.get(API_ENDPOINTS.STORE_PRODUCTS + `${slug}/products/`);
  }

  getProductDetailById(productId: string): Observable<any> {
    return this.http.get(`${API_ENDPOINTS.PRODUCT_DETAIL}${productId}/`);
  }
  getProductDetailBySlug(productSlug: string): Observable<any> {
    return this.http.get(`${API_ENDPOINTS.PRODUCT_DETAIL}${productSlug}/`);
  }
  getRelatedProductById(productId: string): Observable<any> {
    return this.http.get(`${API_ENDPOINTS.RELATED_PRODUCT}${productId}/related/`);
  }
  getRelatedProductBySlug(productSlug: string): Observable<any> {
    return this.http.get(`${API_ENDPOINTS.RELATED_PRODUCT}${productSlug}/related/`);
  }
}
