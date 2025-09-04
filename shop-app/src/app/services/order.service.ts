import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { API_ENDPOINTS } from '../shared/constants/api.constants';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { Order } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class OrderService {

    constructor(
        private http: HttpClient,
        @Inject(PLATFORM_ID) private platformId: Object
    ) { }

    getOrderSummary(orderId: string): Observable<Order> {
        return this.http.get<Order>(`${API_ENDPOINTS.GET_ORDERSUMMARY}/${orderId}/`);
    }

    getOrderHistory(): Observable<any> {
        return this.http.get<any>(API_ENDPOINTS.GET_ORDERHISTORY);
    }
}
