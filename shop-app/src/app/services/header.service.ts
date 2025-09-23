// src/app/services/header-count.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { API_ENDPOINTS } from '../shared/constants/api.constants';
export interface HeaderCount {cart_count:number;
    subscription_count:number}

@Injectable({ providedIn: 'root' })
export class HeaderCountService {
  private countsSubject = new BehaviorSubject<HeaderCount>({cart_count:0,subscription_count:0});
  counts$ = this.countsSubject.asObservable();

  constructor(private http: HttpClient) {}

  fetchCounts() {
    this.http.get<HeaderCount>(API_ENDPOINTS.GET_HEADERS_COUNT)
      .subscribe(data => this.countsSubject.next(data));
  }

  // Optional: allow manual update after add/remove
  updateCountsManually(newCounts: HeaderCount) {
    this.countsSubject.next(newCounts);
  }
}
