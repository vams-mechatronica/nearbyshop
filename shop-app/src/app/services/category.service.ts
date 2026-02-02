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

  getStores(url?: string): Observable<any> {
    return this.http.get(url ?? API_ENDPOINTS.STORES_V2);
  }

  getStoresByPincode(pincode: string, url?: string) {
  return this.http.get(url ?? API_ENDPOINTS.STORES_WITH_PINCODE_V2 + pincode);
}

}
