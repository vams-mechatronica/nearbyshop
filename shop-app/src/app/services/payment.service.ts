import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../shared/constants/api.constants';
import { InitiatePayment } from '../models/payment.model';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  
  constructor(private http: HttpClient) {}

  getSubscriptions(): Observable<any[]> {
    return this.http.get<any[]>(API_ENDPOINTS.GET_SUBSCRIPTION);
  }
  verifyPayment(data: any) {
    return this.http.post<any>(API_ENDPOINTS.VERIFY_RAZORPAY_ORDER,{data});
  }

  createOrder(amount: any): Observable<InitiatePayment> {
    return this.http.post<InitiatePayment>(API_ENDPOINTS.CREATE_RAZORPAY_ORDER,{amount});
  }
}
