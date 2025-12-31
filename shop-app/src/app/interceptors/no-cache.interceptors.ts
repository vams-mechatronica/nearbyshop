import { HttpInterceptorFn } from '@angular/common/http';

export const NoCacheInterceptor: HttpInterceptorFn = (req, next) => {
  const noCacheReq = req.clone({
    setHeaders: {
      'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });

  return next(noCacheReq);
};
