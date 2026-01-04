import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../shared/constants/api.constants';
import { AddDeliveryAddress, UserInfo, UserProfileUpdateResponse } from '../models/user.model';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient, private storage: StorageService) { }

  getUserInfo(): Observable<UserInfo> {
    return this.http.get<UserInfo>(API_ENDPOINTS.GET_USERINFO);
  }

  getUserAddress() {
    return this.http.get(API_ENDPOINTS.GET_USERADDRESS);
  }

  addUserAddress(data: AddDeliveryAddress) {
    return this.http.post(API_ENDPOINTS.ADD_USERADDRESS, data);
  }

  getUserWallet() {
    return this.http.get(API_ENDPOINTS.GET_USERWALLET);
  }

  getUserBankDetails() {
    return this.http.get(API_ENDPOINTS.GET_USERBANKDETAILS);
  }

  getUserWalletTransactions() {
    return this.http.get(API_ENDPOINTS.GET_WALLET_TRANSACTION);
  }

  syncGuestAddress(): Observable<any> {
    const guestAddressStr = this.storage.getItem('selectedAddress');
    if (!guestAddressStr) {
      return new Observable((observer) => {
        observer.next(null);
        observer.complete();
      });
    }

    // convert back to object
    const guestAddress = typeof guestAddressStr === 'string'
      ? JSON.parse(guestAddressStr)
      : guestAddressStr;

    return this.http.post(API_ENDPOINTS.USER_ADDRESS_SYNC, guestAddress);
  }

  updateProfile(data: Partial<UserInfo>) {
    return this.http.put<UserProfileUpdateResponse>(
      API_ENDPOINTS.USER_PROFILE_UPDATE,
      data
    );
  }

}
