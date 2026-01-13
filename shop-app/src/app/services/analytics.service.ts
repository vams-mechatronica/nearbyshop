import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

declare global {
  interface Window {
    gtag: Function;
  }
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId) && typeof window.gtag === 'function';
  }

  trackEvent(
    eventName: string,
    eventCategory: string,
    value?: number,
    label?: string
  ): void {
    if (!this.isBrowser()) return;

    window.gtag('event', eventName, {
      event_category: eventCategory,
      event_label: label ?? eventName,
      value: value
    });
  }

  trackPageView(url: string): void {
    if (!this.isBrowser()) return;

    window.gtag('config', 'G-WBGMWPQ6XR', {
      page_path: url
    });
  }
}
