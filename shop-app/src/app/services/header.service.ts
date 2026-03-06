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

  fetchCounts() {
    // Reuse AuthService's token check instead of duplicating it
    const token = this.storage.getItem('access_token');
    if (token && this.isTokenValid(token)) {
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

      this.countsSubject.next({
        cart_count: cartCount,
        subscription_count: 0
      } as HeaderCount);

    }
  }

  private isTokenValid(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp && payload.exp > Math.floor(Date.now() / 1000);
    } catch {
      return false;
    }
  }

  // Optional: allow manual update after add/remove
  updateCountsManually(newCounts: HeaderCount) {
    this.countsSubject.next(newCounts);
  }

  updateCartSummary(cart: { total_items: number }) {
    this.updateCountsManually({
      cart_count: cart.total_items,
      subscription_count: this.getCurrentSubscriptionCount()
    });
  }

   private getCurrentSubscriptionCount(): number {
    return this.countsSubject.getValue()?.subscription_count ?? 0;
  }
}
