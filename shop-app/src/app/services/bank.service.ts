import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { StorageService } from './storage.service';
import { Observable, of } from 'rxjs';

interface BankDetail {
  account_holder_name: string;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
}


@Injectable({ providedIn: 'root' })
export class BankService {
  private apiUrl = API_ENDPOINTS.ADD_USERBANKDETAILS;

  constructor(private http: HttpClient, private storage: StorageService, private authService: AuthService) {}

  addBankDetail(bank: BankDetail): Observable<any> {
    if (this.authService.hasToken()) {
      // 🔹 Send to backend API
      return this.http.post(this.apiUrl, bank);
    } else {
      // 🔹 Store locally in localStorage
      const localBanks = JSON.parse(localStorage.getItem('pendingBanks') || '[]');
      localBanks.push(bank);
      localStorage.setItem('pendingBanks', JSON.stringify(localBanks));

      console.warn('User not logged in. Bank detail stored locally.');
      return of({ status: 'stored_locally', data: bank });
    }
  }

  // Optional: Sync pending banks when token becomes available
  syncPendingBanks(): Observable<any> {
    if (!this.authService.hasToken()) return of({ status: 'no_token' });

    const pendingBanks: BankDetail[] = JSON.parse(localStorage.getItem('pendingBanks') || '[]');
    if (!pendingBanks.length) return of({ status: 'nothing_to_sync' });

    // Send them all and clear storage
    return this.http.post(`${this.apiUrl}/bulk`, pendingBanks).pipe(
      tap(() => {
        localStorage.removeItem('pendingBanks');
        console.log('Pending banks synced with server');
      })
    );
  }
}
import { tap } from 'rxjs/operators';
import { AuthService } from './auth.service';import { API_ENDPOINTS } from '../shared/constants/api.constants';

