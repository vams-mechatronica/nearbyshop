import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpHandlerFn
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { StorageService } from '../services/storage.service';
import { AuthService } from '../services/auth.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthComponent } from '../components/auth/auth.component';
import { isPlatformBrowser } from '@angular/common';

// shared state for refresh
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const AuthInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  const storage = inject(StorageService);
  const authService = inject(AuthService);
  const modalService = inject(NgbModal);
  const platformId = inject(PLATFORM_ID);

  // SSR-safe token retrieval
  const token = storage.getItem('access_token');
  let authReq = req;

  if (token) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(authReq).pipe(
  catchError((error: HttpErrorResponse) => {
    // only attempt refresh on the browser
    if (error.status === 401 && isPlatformBrowser(platformId)) {
      if (!isRefreshing) {
        isRefreshing = true;
        refreshTokenSubject.next(null);

        return authService.refreshToken().pipe(
          switchMap((res: any) => {
            isRefreshing = false;
            storage.setItem('access_token', res.access);
            refreshTokenSubject.next(res.access);

            const newReq = authReq.clone({
              setHeaders: { Authorization: `Bearer ${res.access}` },
            });
            return next(newReq);
          }),
          catchError((err) => {
            isRefreshing = false;
            storage.removeItem('access_token');
            storage.removeItem('refresh_token');

            if (isPlatformBrowser(platformId)) {
              modalService.open(AuthComponent, { centered: true, size: 'sm' });
            }

            return throwError(() => err);
          })
        );
      } else {
        // already refreshing → wait
        return refreshTokenSubject.pipe(
          filter((token) => token != null),
          take(1),
          switchMap((token) => {
            const newReq = authReq.clone({
              setHeaders: { Authorization: `Bearer ${token}` },
            });
            return next(newReq);
          })
        );
      }
    }

    return throwError(() => error);
  })
);

};