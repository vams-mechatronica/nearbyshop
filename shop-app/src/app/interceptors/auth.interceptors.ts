import { inject, Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { StorageService } from '../services/storage.service';
import { AuthService } from '../services/auth.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthComponent } from '../components/auth/auth.component';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const storage = inject(StorageService);
    const authService = inject(AuthService);
    const modalService = inject(NgbModal);

    const token = storage.getItem('access_token');
    let authReq = req;

    if (token) {
      authReq = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // 🔹 Try refreshing
          if (!this.isRefreshing) {
            this.isRefreshing = true;
            this.refreshTokenSubject.next(null);

            return authService.refreshToken().pipe(
              switchMap((res: any) => {
                this.isRefreshing = false;

                // Save new access token
                storage.setItem('access_token', res.access);

                this.refreshTokenSubject.next(res.access);

                // Retry failed request with new token
                const newReq = authReq.clone({
                  setHeaders: { Authorization: `Bearer ${res.access}` }
                });
                return next.handle(newReq);
              }),
              catchError(err => {
                this.isRefreshing = false;

                // If refresh also fails → open login modal
                storage.removeItem('access_token');
                storage.removeItem('refresh_token');
                modalService.open(AuthComponent, { centered: true, size: 'sm' });

                return throwError(() => err);
              })
            );
          } else {
            // If already refreshing, wait until done
            return this.refreshTokenSubject.pipe(
              filter(token => token != null),
              take(1),
              switchMap(token => {
                const newReq = authReq.clone({
                  setHeaders: { Authorization: `Bearer ${token}` }
                });
                return next.handle(newReq);
              })
            );
          }
        }

        return throwError(() => error);
      })
    );
  }
}
