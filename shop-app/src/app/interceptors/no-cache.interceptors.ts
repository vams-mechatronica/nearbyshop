import { HttpInterceptorFn } from '@angular/common/http';

export const NoCacheInterceptor: HttpInterceptorFn = (req, next) => {
  // Only apply no-cache headers to mutation requests (POST, PUT, PATCH, DELETE)
  // Allow GET requests to benefit from browser/CDN caching
  if (req.method !== 'GET') {
    const noCacheReq = req.clone({
      setHeaders: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    return next(noCacheReq);
  }

  return next(req);
};
