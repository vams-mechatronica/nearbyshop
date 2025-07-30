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
}
