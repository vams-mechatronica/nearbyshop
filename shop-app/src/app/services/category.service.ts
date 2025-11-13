import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../shared/constants/api.constants';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  constructor(private http: HttpClient) {}

  getCategories(): Observable<any> {
    return this.http.get(API_ENDPOINTS.CATEGORIES);
  }

  getStores(): Observable<any> {
    return this.http.get(API_ENDPOINTS.STORES);
  }

  getStoresByPincode(pincode: string) {
  return this.http.get(API_ENDPOINTS.STORES_WITH_PINCODE + pincode);
}
}
