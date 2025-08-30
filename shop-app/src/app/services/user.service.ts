import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../shared/constants/api.constants';
import { AddDeliveryAddress, UserInfo } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient) { }

  getUserInfo(): Observable<UserInfo> {
    return this.http.get<UserInfo>(API_ENDPOINTS.GET_USERINFO);
  }

  getUserAddress() {
    return this.http.get(API_ENDPOINTS.GET_USERADDRESS);
  }

  addUserAddress(data: AddDeliveryAddress){
    return this.http.post(API_ENDPOINTS.ADD_USERADDRESS,data);
  }

  getUserWallet(){
    return this.http.get(API_ENDPOINTS.GET_USERWALLET);
  }

}
