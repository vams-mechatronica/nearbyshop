import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { StorageService } from './storage.service';
import { Observable, of } from 'rxjs';
import { API_ENDPOINTS } from '../shared/constants/api.constants';

@Injectable({ providedIn: 'root' })
export class ShopService {

  constructor(private http: HttpClient, private storage: StorageService) {}

  getShopDetails(slug: string): Observable<any> {
    return this.http.get(API_ENDPOINTS.STORE_DETAILS + slug + '/');
  }
  
}

