import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../shared/constants/api.constants';

@Injectable({ providedIn: 'root' })
export class WalletService {
  
  constructor(private http: HttpClient) {}

  getSubscriptions(): Observable<any[]> {
    return this.http.get<any[]>(API_ENDPOINTS.GET_SUBSCRIPTION);
  }
}
