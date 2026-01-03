import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot
} from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { AuthModalService } from '../../services/auth-modal.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(
    private auth: AuthService,
    private authModal: AuthModalService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {

    // ✅ SSR render → allow page (no auth check on server)
    if (!isPlatformBrowser(this.platformId)) {
      return true;
    }

    // ✅ Browser only
    if (this.auth.isLoggedIn()) {
      return true;
    }

    // ✅ Safe localStorage usage
    localStorage.setItem('redirect_url', state.url);

    // ✅ Open login modal
    this.authModal.openLogin();

    // ❌ Block navigation
    return false;
  }
}
