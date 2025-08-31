import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../shared/constants/api.constants';
import { InitiatePayment, InitiatePaymentOrder } from '../models/payment.model';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  
  constructor(private http: HttpClient) {}

  getSubscriptions(): Observable<any[]> {
    return this.http.get<any[]>(API_ENDPOINTS.GET_SUBSCRIPTION);
  }

  verifyPayment(data: any) {
    return this.http.post<any>(API_ENDPOINTS.VERIFY_WALLET_RECHARGE_RAZORPAY_ORDER,{data});
  }

  createOrder(amount: any): Observable<InitiatePayment> {
    return this.http.post<InitiatePayment>(API_ENDPOINTS.CREATE_WALLET_RECHARGE_RAZORPAY_ORDER,{amount});
  }

  createCartPaymentOrder(amount: any, orderId: number): Observable<InitiatePaymentOrder> {
    const body = {
      amount: amount,
      order_id: orderId
    }
    return this.http.post<InitiatePaymentOrder>(API_ENDPOINTS.CREATE_CART_PAYMENT_RAZORPAY_ORDER,body);
  }

  verifyCartPaymentOrder(data: any) {
    return this.http.post<any>(API_ENDPOINTS.VERIFY_CART_PAYMENT_RAZORPAY_ORDER,{data});
  }
}
