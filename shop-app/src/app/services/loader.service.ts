import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoaderService {
  private loading = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.loading.asObservable();

  show() {
    this.loading.next(true);
  }

  hide() {
  setTimeout(() => {
    this.loading.next(false);
  }, 300);
}
}
