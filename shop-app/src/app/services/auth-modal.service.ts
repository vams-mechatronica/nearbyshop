import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthComponent } from '../components/auth/auth.component';
// import { AuthComponent } from '../../layout/auth/auth.component';

@Injectable({ providedIn: 'root' })
export class AuthModalService {

  private isOpen = false; // prevent multiple modals

  constructor(private modalService: NgbModal) {}

  openLogin(): void {
    if (this.isOpen) return;

    const modalRef = this.modalService.open(AuthComponent, {
      centered: true,
      size: 'sm',
      backdrop: 'static',
      keyboard: false
    });

    this.isOpen = true;

    modalRef.result.finally(() => {
      this.isOpen = false;
    });
  }
}
