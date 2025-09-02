import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type StorageType = 'localStorage' | 'sessionStorage';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  getItem(key: string, storageType: StorageType = 'localStorage'): string | null {
    if (!this.isBrowser) return null;
    try {
      return window[storageType].getItem(key);
    } catch {
      return null;
    }
  }

  setItem(key: string, value: string, storageType: StorageType = 'localStorage'): void {
    if (!this.isBrowser) return;
    try {
      window[storageType].setItem(key, value);
    } catch {
      // e.g. quota exceeded
    }
  }

  removeItem(key: string, storageType: StorageType = 'localStorage'): void {
    if (!this.isBrowser) return;
    try {
      window[storageType].removeItem(key);
    } catch {}
  }

  clear(storageType: StorageType = 'localStorage'): void {
    if (!this.isBrowser) return;
    try {
      window[storageType].clear();
    } catch {}
  }
}
