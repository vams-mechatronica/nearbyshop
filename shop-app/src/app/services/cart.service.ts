import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { API_ENDPOINTS } from '../shared/constants/api.constants';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { forkJoin, Observable, of, tap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { StorageService } from './storage.service';
import { AuthService } from './auth.service';
import { CartFullResponse, CartItem, CartResponse } from '../models/cart.model';
import { HeaderCount, HeaderCountService } from './header.service';

@Injectable({ providedIn: 'root' })
export class CartService {
  cartItems!: CartResponse;

  cart: any = null;
  constructor(
    private http: HttpClient,
    private storage: StorageService,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }
  addToCart(product: any) {
    if (this.authService.hasToken()) {

      const body = {
        product_id: product.id,
        quantity: 1
      };
      return this.http.post<any>(API_ENDPOINTS.ADD_TO_CART, body);
    } else {
      // Fallback: store in localStorage for guest users
      let cart = JSON.parse(this.storage.getItem('cart') || '[]');

      // Check if product already exists -> update quantity instead of duplicate push
      const existingItem = cart.find((item: any) => item.product_id === product.id);

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.push({ product_id: product.id, quantity: 1 });
      }

      this.storage.setItem('cart', JSON.stringify(cart));

      return of(cart);
    }
  }



  getCart(): Observable<any> {

    if (this.authService.hasToken()) {
      return this.http.get<any>(API_ENDPOINTS.GET_CART);
    } else {
      const cart = JSON.parse(this.storage.getItem('cart') || '[]');
      return of(cart);
    }
  }


  /** ✅ Update quantity */
  updateCartItem(productId: number, quantity: number): Observable<CartResponse> {
    if (this.authService.hasToken()) {
      // Logged-in user → API call (interceptor adds headers)
      const body = { product_id: productId, quantity: quantity };
      return this.http.put<CartResponse>(`${API_ENDPOINTS.UPDATE_CART_ITEM}`, body);
    } else {
      // Guest user → update localStorage
      this.cart = this.storage.getItem('cart');
      this.cartItems = this.cart ? JSON.parse(this.cart) as CartResponse : { items: [], total: 0 };

      const item = this.cartItems.items.find((p: CartItem) => p.product.id === productId);

      if (item) {
        if (quantity > 0) {
          item.quantity = quantity;
          // also update the price for that item
          item.price = (Number(item.product.price) * quantity).toFixed(2);
        } else {
          // ✅ correctly reassign the filtered array
          this.cartItems.items = this.cartItems.items.filter((p: CartItem) => p.product.id !== productId);
        }
      }

      // ✅ recalculate total
      this.cartItems.total = this.cartItems.items.reduce(
        (sum, i) => sum + Number(i.price),
        0
      );

      this.storage.setItem('cart', JSON.stringify(this.cartItems));
      return of(this.cartItems);
    }
  }

  /** ✅ Delete item */
  deleteCartItem(productId: number): Observable<CartResponse> {
    if (this.authService.hasToken()) {
      // Logged-in user → API call
      return this.http.delete<CartResponse>(`${API_ENDPOINTS.DELETE_CART_ITEM}/${productId}/`);
    } else {
      // Guest user → remove from localStorage
      const stored = this.storage.getItem('cart');
      let cart: CartResponse = stored ? JSON.parse(stored) as CartResponse : { items: [], total: 0 };

      // filter out product
      cart.items = cart.items.filter((p: CartItem) => p.product.id !== productId);

      // recalc total
      cart.total = cart.items.reduce((sum, i) => sum + Number(i.price), 0);

      this.storage.setItem('cart', JSON.stringify(cart));
      return of(cart);
    }
  }
  applyCoupon(code: string): Observable<any> {
    const body = {
      code: code
    }
    return this.http.post(`${API_ENDPOINTS.APLLY_COUPON}`, body);
  }

  createOrder(cartId: number, addressId: number, paymentMethod: string, coupon: string | null) {
    const body = {
      cart_id: cartId,
      address_id: addressId,
      payment_method: paymentMethod,
      coupon_code: coupon
    }
    return this.http.post<any>(API_ENDPOINTS.CREATE_ORDER, body);
  }

  syncGuestCart(): Observable<any> {
    const stored = this.storage.getItem('cart');
    if (!stored) {
      return of(null); // nothing to sync
    }

    const guestCart: CartResponse = JSON.parse(stored);

    if (!guestCart.items.length) {
      return of(null);
    }

    // Send items to API (depends on your backend)
    const syncCalls = guestCart.items.map((item: CartItem) => {
      return this.http.post(`${API_ENDPOINTS.ADD_TO_CART}`, {
        product_id: item.product.id,
        quantity: item.quantity
      });
    });

    // run all calls in parallel
    return forkJoin(syncCalls).pipe(
      tap(() => {
        // clear guest cart after sync
        this.storage.removeItem('cart');
      })
    );
  }

  checkDeliveryAddress(zip: any){
    return this.http.get<any>(API_ENDPOINTS.VERIFY_PINCODE,{params: {pincode: zip}});
  }

}
