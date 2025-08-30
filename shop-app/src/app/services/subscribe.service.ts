import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { API_ENDPOINTS } from '../shared/constants/api.constants';
import { SubscriptionResponse } from '../models/subscribe.model';
import { hasToken } from '../shared/utility/utils.common';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {

  constructor(private http: HttpClient) { }

  getSubscriptions(): Observable<SubscriptionResponse> {
    return this.http.get<SubscriptionResponse>(API_ENDPOINTS.GET_SUBSCRIPTION);
  }

  addSubscription(product: any, frequency: string, startDate: string, quantity: number) {
    if (hasToken()) {

      const body = {
        product_id: product.id,
        start_date: startDate,
        frequency: frequency,
        quantity: quantity
      };
      return this.http.post<any>(API_ENDPOINTS.ADD_SUBSCRIPTION, body);
    } else {
      // Fallback: store in localStorage for guest users
      let subs = JSON.parse(localStorage.getItem('subscriptions') || '[]');
      subs.push({ product, frequency, startDate });
      localStorage.setItem('subscriptions', JSON.stringify(subs));
      return of(subs);
    }
  }
  updateSubscription(subId: number, body: any ){
    return this.http.patch<any>(`${API_ENDPOINTS.UPDATE_SUBSCRIPTION}/${subId}/`, body);
  }
  pauseSubscription(subId: number,status: string){
    const body = {
      status: status
    }
    return this.http.patch<any>(`${API_ENDPOINTS.UPDATE_SUBSCRIPTION}/${subId}/`, body);
  }

  frequencyUpdateSubscription(subId: number, frequency: string){
    const body = {
      frequency: frequency
    }
    return this.http.patch<any>(`${API_ENDPOINTS.UPDATE_SUBSCRIPTION}/${subId}/`, body);
  }
}
