import { Injectable } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ServiceBookingComponent } from '../components/service-booking/service-booking.component';
import { Shop } from '../models/vendor.model';
import { Booking } from '../models/booking.model';

@Injectable({ providedIn: 'root' })
export class BookingModalService {
  private isOpen = false;
  private modalRef: NgbModalRef | null = null;

  constructor(private modalService: NgbModal) {}

  /**
   * Open the booking modal for a shop
   * @param shop The shop to book a service from
   * @returns Promise that resolves with the booking if successful
   */
  openBooking(shop: Shop): Promise<Booking | null> {
    if (this.isOpen) {
      return Promise.resolve(null);
    }

    this.modalRef = this.modalService.open(ServiceBookingComponent, {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      windowClass: 'booking-modal-window'
    });

    this.modalRef.componentInstance.shop = shop;
    this.isOpen = true;

    return this.modalRef.result
      .then((booking: Booking) => {
        this.isOpen = false;
        return booking;
      })
      .catch(() => {
        this.isOpen = false;
        return null;
      });
  }

  /**
   * Close the booking modal if open
   */
  closeBooking(): void {
    if (this.modalRef) {
      this.modalRef.dismiss();
      this.modalRef = null;
      this.isOpen = false;
    }
  }

  /**
   * Check if booking modal is currently open
   */
  isBookingOpen(): boolean {
    return this.isOpen;
  }
}
