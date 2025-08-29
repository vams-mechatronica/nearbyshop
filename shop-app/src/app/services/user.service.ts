import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../shared/constants/api.constants';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient) { }

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

}
