import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot
} from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AuthModalService } from '../../services/auth-modal.service';


@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(
    private auth: AuthService,
    private authModal: AuthModalService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {

    if (this.auth.isLoggedIn()) {
      return true;
    }

    // ✅ Save intended route
    localStorage.setItem('redirect_url', state.url);

    // ✅ Open login modal
    this.authModal.openLogin();

    // ❌ Block navigation
    return false;
  }
}
