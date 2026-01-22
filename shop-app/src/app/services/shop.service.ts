import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { StorageService } from './storage.service';
import { Observable, of } from 'rxjs';
import { API_ENDPOINTS } from '../shared/constants/api.constants';

@Injectable({ providedIn: 'root' })
export class ShopService {

  constructor(private http: HttpClient, private storage: StorageService) {}

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
    return this.http.get(API_ENDPOINTS.STORES_WITH_PINCODE_V2, { params });
  }
}

