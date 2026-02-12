// vendor.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { 
  Shop,
  Vendor, 
  ShopProfileResponse, 
  ShopStats 
} from '../models/vendor.model';
import { Product, ProductFilter } from '../models/product.model';
import { Review, RatingDistribution, ReviewRequest } from '../models/review.model';
import { ApiResponse } from '../models/api-response.model';
import { API_ENDPOINTS } from '../shared/constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class ShopService {
  private apiUrl = `${environment.apiUrl}/vendors`;

  constructor(private http: HttpClient) {}

  
}