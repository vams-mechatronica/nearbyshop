import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { API_ENDPOINTS } from '../shared/constants/api.constants';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class CartService {

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }
  addToCart(product: any) {
    const token = sessionStorage.getItem('access_token');
    console.log(token);

    if (token !== null && token !== '') {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      const body = {
        product_id: product.id,
        quantity: 1
      };

      console.log(body);

      return this.http.post<any>(API_ENDPOINTS.ADD_TO_CART, body, { headers });
    } else {
      // Fallback: store in localStorage for guest users
      let cart = JSON.parse(localStorage.getItem('cart') || '[]');

      // Check if product already exists -> update quantity instead of duplicate push
      const existingItem = cart.find((item: any) => item.product_id === product.id);

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.push({ product_id: product.id, quantity: 1 });
      }

      localStorage.setItem('cart', JSON.stringify(cart));

      return cart;
    }
  }

  addSubscription(product: any, frequency: string, startDate: string) {
    // let subs = JSON.parse(localStorage.getItem('subscriptions') || '[]');
    // subs.push({ product, frequency, startDate });
    // localStorage.setItem('subscriptions', JSON.stringify(subs));
  }

  getCart(): Observable<any> {
    const token = sessionStorage.getItem('access_token');

    if (token && token !== '') {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      return this.http.get<any>(API_ENDPOINTS.GET_CART, { headers });
    } else {
      // Fallback: return cart from localStorage for guest users
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      return of(cart); // ✅ wrap in Observable so return type matches
    }
  }

  getSubscriptions() {
    return JSON.parse('[]');
  }

  private hasToken(): boolean {
    const token = sessionStorage.getItem('access_token');
    return !!token && token !== '';
  }

  /** ✅ Update quantity */
  updateCartItem(productId: number, quantity: number): Observable<any> {
    if (this.hasToken()) {
      // Logged-in user → API call (interceptor adds headers)
      const body = { product_id: productId, quantity: quantity };
      return this.http.put<any>(API_ENDPOINTS.UPDATE_CART_ITEM, body);
    } else {
      // Guest user → update localStorage
      let cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const item = cart.find((p: any) => p.product_id === productId);

      if (item) {
        if (quantity > 0) {
          item.quantity = quantity;
        } else {
          // remove if qty becomes 0
          cart = cart.filter((p: any) => p.product_id !== productId);
        }
      }

      localStorage.setItem('cart', JSON.stringify(cart));
      return of(cart); // wrap in Observable to keep consistent return type
    }
  }

  /** ✅ Delete item */
  deleteCartItem(productId: number): Observable<any> {
    if (this.hasToken()) {
      // Logged-in user → API call
      return this.http.delete<any>(`${API_ENDPOINTS.DELETE_CART_ITEM}/${productId}/`);
    } else {
      // Guest user → remove from localStorage
      let cart = JSON.parse(localStorage.getItem('cart') || '[]');
      cart = cart.filter((p: any) => p.product_id !== productId);
      localStorage.setItem('cart', JSON.stringify(cart));
      return of(cart);
    }
  }
}
