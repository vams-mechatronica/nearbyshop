import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../shared/constants/api.constants';
import { Wallet } from '../models/wallet.model';

@Injectable({ providedIn: 'root' })
export class WalletService {
  
  constructor(private http: HttpClient) {}

  getWalletBalance(): Observable<Wallet> {
    return this.http.get<Wallet>(API_ENDPOINTS.GET_USERWALLET);
  }
}
