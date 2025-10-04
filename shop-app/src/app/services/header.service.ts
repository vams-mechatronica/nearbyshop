// src/app/services/header-count.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { API_ENDPOINTS } from '../shared/constants/api.constants';
import { StorageService } from './storage.service';
import { AuthService } from './auth.service';
export interface HeaderCount {
  cart_count: number;
  subscription_count: number
}

@Injectable({ providedIn: 'root' })
export class HeaderCountService {
  private countsSubject = new BehaviorSubject<HeaderCount>({ cart_count: 0, subscription_count: 0 });
  counts$ = this.countsSubject.asObservable();

  constructor(private http: HttpClient,
    private storage: StorageService) { }

  // ✅ Access token helpers
  getAccessToken(): string | null {
    return this.storage.getItem('access_token');
  }

  hasToken(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp && payload.exp > now;
    } catch {
      return false;
    }
  }

  fetchCounts() {
    if (this.hasToken()) {
      this.http.get<HeaderCount>(API_ENDPOINTS.GET_HEADERS_COUNT)
        .subscribe(data => this.countsSubject.next(data));
    } else {
      // Token expired → fallback to localStorage
      const cart = JSON.parse(this.storage.getItem('cart') || '{"items": []}');
      const cartItems = cart.items || [];

      const cartCount = cartItems.reduce(
        (total: number, item: any) => total + (item.quantity || 0),
        0
      );
      // console.log(cart);

      this.countsSubject.next({
        cart_count: cartCount,
        subscription_count: 0
      } as HeaderCount);

    }
  }

  // Optional: allow manual update after add/remove
  updateCountsManually(newCounts: HeaderCount) {
    this.countsSubject.next(newCounts);
  }
}
