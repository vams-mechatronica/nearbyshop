import { ApplicationConfig, inject, PLATFORM_ID, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { isPlatformBrowser } from '@angular/common';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';


export const authInterceptor = (req: any, next: any) => {
  const platformId = inject(PLATFORM_ID);
  let token: string | null = null;

  if (isPlatformBrowser(platformId)) {
    token = sessionStorage.getItem('access_token');
  }

  if (token && token !== '') {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return next(cloned);
  }

  return next(req);
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes), 
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch(),withInterceptors([authInterceptor])),
    provideAnimations(), // required for toastr
    provideToastr({
      timeOut: 3000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      closeButton: true,
      progressBar: true,
      extendedTimeOut: 2000, // extra time if hovered
      tapToDismiss: true,   
    }),
    
  ]
};
