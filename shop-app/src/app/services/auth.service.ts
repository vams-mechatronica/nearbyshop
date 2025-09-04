import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../shared/constants/api.constants';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient,private storage: StorageService) { }

  sendLoginOtp(phone: string) {
    return this.http.post(API_ENDPOINTS.GET_LOGIN_OTP, {
      phone_number: phone  // <-- change the key here
    });
  }

  verifyOtp(phone: string, otp: string) {
    return this.http.post(API_ENDPOINTS.VERIFY_OTP, {
      phone_number: phone,
      otp: otp
    });
  }
  hasToken(): boolean {
    const token = this.storage.getItem('access_token');
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp && payload.exp > now;
    } catch {
      return false;
    }
  }

}
