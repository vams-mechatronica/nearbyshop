import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { API_ENDPOINTS } from '../shared/constants/api.constants';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class CartService {

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }
  addToCart(product: any) {
    const token = sessionStorage.getItem('access_token') || '';

    if (token) {
      const headers = new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });

      const body = {
        product_id: product.id,
        quantity: product.qty
      };

      return this.http.post<any>(API_ENDPOINTS.ADD_TO_CART, body, { headers });
    } else {
      // Fallback: store in localStorage for guest users
      let cart = JSON.parse(localStorage.getItem('cart') || '[]');

      // Check if product already exists -> update quantity instead of duplicate push
      const existingItem = cart.find((item: any) => item.product_id === product.id);

      if (existingItem) {
        existingItem.quantity += product.qty;
      } else {
        cart.push({ product_id: product.id, quantity: product.qty });
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
    let token = '';

    // if (isPlatformBrowser(this.platformId)) {
    //   // ✅ only access localStorage in browser
    // }
    token = sessionStorage.getItem('access_token') || '';

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get<any>(API_ENDPOINTS.GET_CART, { headers });
  }

  getSubscriptions() {
    return JSON.parse('[]');
  }

}
