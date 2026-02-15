import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type StorageType = 'localStorage' | 'sessionStorage';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private isBrowser: boolean;
  private readonly PREFIX = 'app_';

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  private getStorage(storageType: StorageType = 'localStorage'): Storage | null {
    if (!this.isBrowser) return null;
    return window[storageType];
  }

  // ✅ JSON methods with prefix
  setItemA(key: string, value: any): void {
    const storage = this.getStorage();
    if (!storage) return;

    try {
      storage.setItem(this.PREFIX + key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to storage', error);
    }
  }

  getItemA(key: string){
    const storage = this.getStorage();
    if (!storage) return null;

    try {
      const value = storage.getItem(this.PREFIX + key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Error reading from storage', error);
      return null;
    }
  }

  removeItemA(key: string): void {
    const storage = this.getStorage();
    if (!storage) return;

    storage.removeItem(this.PREFIX + key);
  }

  clearA(): void {
    const storage = this.getStorage();
    if (!storage) return;

    Object.keys(storage)
      .filter(key => key.startsWith(this.PREFIX))
      .forEach(key => storage.removeItem(key));
  }

  // ✅ Generic methods
  getItem(key: string, storageType: StorageType = 'localStorage'): string | null {
    const storage = this.getStorage(storageType);
    if (!storage) return null;

    try {
      return storage.getItem(key);
    } catch {
      return null;
    }
  }

  setItem(key: string, value: string, storageType: StorageType = 'localStorage'): void {
    const storage = this.getStorage(storageType);
    if (!storage) return;

    try {
      storage.setItem(key, value);
    } catch {}
  }

  removeItem(key: string, storageType: StorageType = 'localStorage'): void {
    const storage = this.getStorage(storageType);
    if (!storage) return;

    try {
      storage.removeItem(key);
    } catch {}
  }

  clear(storageType: StorageType = 'localStorage'): void {
    const storage = this.getStorage(storageType);
    if (!storage) return;

    try {
      storage.clear();
    } catch {}
  }
}
