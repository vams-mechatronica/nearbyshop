import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { API_ENDPOINTS } from '../shared/constants/api.constants';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { StorageService } from './storage.service';

@Injectable({ providedIn: 'root' })
export class BannerService {

  constructor(
    private http: HttpClient,
    private storage: StorageService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  private hasToken(): boolean {
    const token = this.storage.getItem('access_token');
    return !!token && token !== '';
  }

  getBanners() {
    return this.http.get<any>(API_ENDPOINTS.GET_BANNERS);
  }

}
