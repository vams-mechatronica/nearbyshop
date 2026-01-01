import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_ENDPOINTS } from '../shared/constants/api.constants';
import { StorageService } from './storage.service';
import { HeaderCountService } from './header.service';
import { throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(
    private http: HttpClient,
    private storage: StorageService,
    private headerService: HeaderCountService) { }

  sendLoginOtp(phone: string) {
    return this.http.post(API_ENDPOINTS.GET_LOGIN_OTP, {
      phone_number: phone
    });
  }

  verifyOtp(phone: string, otp: string) {
    return this.http.post(API_ENDPOINTS.VERIFY_OTP, {
      phone_number: phone,
      otp: otp,
      role: 'customer'
    });
  }

  // ✅ Access token helpers
  getAccessToken(): string | null {
    return this.storage.getItem('access_token');
  }

  saveAccessToken(token: string): void {
    this.storage.setItem('access_token', token);
  }

  clearTokens(): void {
    this.storage.removeItem('access_token');
    this.storage.removeItem('refresh_token');
  }

  hasToken(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp && payload.exp > now;
    } catch {
      return false;
    }
  }

  // ✅ If backend supports refresh
  refreshToken() {
    const refresh = this.storage.getItem('refresh_token');
    // you could also check here
    if (!refresh) {
      return throwError(() => new Error('No refresh token'));
    }
    return this.http.post(API_ENDPOINTS.REFRESH_TOKEN, { refresh });
  }


  logout() {
    this.clearTokens();
    localStorage.removeItem('redirect_url');
    this.headerService.updateCountsManually({
      cart_count: 0,
      subscription_count: 0
    });
  }


  isLoggedIn(): boolean {
    return this.hasToken();
  }

}
