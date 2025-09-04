import { inject } from '@angular/core';
import { StorageService } from '../../services/storage.service';

export function hasToken(): boolean {
  const storage = inject(StorageService);
  const token = storage.getItem('access_token');

  if (!token) {
    return false;
  }

  try {
    // JWT structure: header.payload.signature
    const payload = JSON.parse(atob(token.split('.')[1]));

    // exp is usually in seconds
    const expiry = payload.exp;
    if (!expiry) {
      return false; // invalid token if no exp
    }

    const now = Math.floor(Date.now() / 1000);
    return expiry > now;
  } catch (e) {
    console.error('Invalid JWT:', e);
    return false;
  }
}
