import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CartService {
  addToCart(product: any) {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    cart.push(product);
    localStorage.setItem('cart', JSON.stringify(cart));
  }

  addSubscription(product: any, frequency: string, startDate: string) {
    let subs = JSON.parse(localStorage.getItem('subscriptions') || '[]');
    subs.push({ product, frequency, startDate });
    localStorage.setItem('subscriptions', JSON.stringify(subs));
  }

  getCart() {
    return JSON.parse(localStorage.getItem('cart') || '[]');
  }

  getSubscriptions() {
  return JSON.parse(localStorage.getItem('subscriptions') || '[]');
}

}
