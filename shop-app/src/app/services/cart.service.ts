import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { API_ENDPOINTS } from '../shared/constants/api.constants';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { forkJoin, Observable, of, tap } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { StorageService } from './storage.service';
import { AuthService } from './auth.service';
import { AddToCartApiResponse, CartFullResponse, CartItem, CartResponse } from '../models/cart.model';
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
  // addToCart(data: { product_id: number; quantity: number }) {
  //   return this.http.post(API_ENDPOINTS.ADD_TO_CART, data);
  // }
  addToCart(data: { product_id: number; quantity: number }): Observable<AddToCartApiResponse> {
    return this.http.post<AddToCartApiResponse>(
      API_ENDPOINTS.ADD_TO_CART,
      data
    );
  }


  getCart(): Observable<any> {

    if (this.authService.hasToken()) {
      return this.http.get<any>(API_ENDPOINTS.GET_CART);
    } else {
      const cart = this.getGuestCartData();
      // Normalize guest cart to match API structure
      return of({
        items: cart.items || [],
        total: cart.total || 0,
        total_discount: 0,
        total_price_after_discount: cart.total || 0,
        total_price_before_discount: cart.total || 0,
        id: 0,
        user: 0,
      });
    }
  }


  /** ✅ Update quantity */
  updateCartItem(
    productId: number,
    quantity: number
  ): Observable<AddToCartApiResponse> {

    const body = {
      product_id: productId,
      quantity
    };

    // 🔐 Auth required – interceptor handles token
    return this.http.put<AddToCartApiResponse>(
      API_ENDPOINTS.UPDATE_CART_ITEM,
      body
    );
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

  /* ─── Guest Cart Helpers ─── */

  getGuestCartData(): any {
    const stored = this.storage.getItem('cart');
    if (!stored) return { items: [], total: 0 };
    try {
      const parsed = JSON.parse(stored);
      return parsed && parsed.items ? parsed : { items: [], total: 0 };
    } catch {
      return { items: [], total: 0 };
    }
  }

  private saveGuestCart(cart: any): void {
    this.storage.setItem('cart', JSON.stringify(cart));
  }

  private calcGuestTotal(cart: any): number {
    return cart.items.reduce(
      (sum: number, item: any) =>
        sum + Number(item.product?.final_price || item.product?.price || 0) * item.quantity,
      0
    );
  }

  addToCartGuest(product: any): { quantity: number; totalItems: number } {
    const cart = this.getGuestCartData();
    const existing = cart.items.find((i: any) => i.product.id === product.id);

    if (existing) {
      existing.quantity += 1;
      existing.price = String(
        Number(product.final_price || product.price) * existing.quantity
      );
    } else {
      cart.items.push({
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          final_price: product.final_price,
          image: product.image,
          slug: product.slug,
          unit: product.unit,
          shop: product.shop,
          discount_value: product.discount_value,
          discount_type: product.discount_type,
          stock: product.stock,
        },
        quantity: 1,
        price: String(product.final_price || product.price),
      });
    }

    cart.total = this.calcGuestTotal(cart);
    this.saveGuestCart(cart);

    const item = cart.items.find((i: any) => i.product.id === product.id);
    return {
      quantity: item.quantity,
      totalItems: cart.items.reduce((s: number, i: any) => s + i.quantity, 0),
    };
  }

  updateCartItemGuest(
    productId: number,
    quantity: number
  ): { quantity: number; totalItems: number } {
    const cart = this.getGuestCartData();
    const item = cart.items.find((i: any) => i.product.id === productId);

    if (item) {
      item.quantity = quantity;
      item.price = String(
        Number(item.product.final_price || item.product.price) * quantity
      );
    }

    cart.total = this.calcGuestTotal(cart);
    this.saveGuestCart(cart);

    return {
      quantity: item?.quantity || 0,
      totalItems: cart.items.reduce((s: number, i: any) => s + i.quantity, 0),
    };
  }

  deleteCartItemGuest(productId: number): number {
    const cart = this.getGuestCartData();
    cart.items = cart.items.filter((i: any) => i.product.id !== productId);
    cart.total = this.calcGuestTotal(cart);
    this.saveGuestCart(cart);
    return cart.items.reduce((s: number, i: any) => s + i.quantity, 0);
  }

  /** Merge guest cart quantities into a product array */
  mergeGuestQty(products: any[]): void {
    if (this.authService.hasToken()) return;
    const cart = this.getGuestCartData();
    if (!cart.items?.length) return;

    products.forEach((p: any) => {
      const item = cart.items.find((i: any) => i.product.id === p.id);
      if (item) {
        p.qty = item.quantity;
      }
    });
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

  checkDeliveryAddress(zip: any) {
    return this.http.get<any>(API_ENDPOINTS.VERIFY_PINCODE, { params: { pincode: zip } });
  }

}
