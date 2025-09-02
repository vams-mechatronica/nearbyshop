import { inject } from '@angular/core';
import { StorageService } from '../../services/storage.service';

export function hasToken(): boolean {
  const storage = inject(StorageService);
  const token = storage.getItem('access_token');
  return !!token && token !== '';
}
