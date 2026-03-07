import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { AuthModalService } from '../../services/auth-modal.service';
import { HeaderCountService } from '../../services/header.service';
import { SubscriptionService } from '../../services/subscribe.service';
import { ToastrService } from 'ngx-toastr';
import { SubscribeModalComponent } from '../components/subscribe-modal/subscribe-modal.component';
import { filter, take } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CartActionsService {

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private authModal: AuthModalService,
    private headerService: HeaderCountService,
    private subscribeService: SubscriptionService,
    private toastr: ToastrService,
    private ngbModal: NgbModal,
  ) {
    // Sync guest cart to server whenever user logs in
    this.authService.isLoggedIn$.pipe(
      filter(loggedIn => loggedIn),
    ).subscribe(() => {
      this.cartService.syncGuestCart().subscribe({
        next: () => this.headerService.fetchCounts(),
      });
    });
  }

  private get isGuest(): boolean {
    return !this.authService.isLoggedIn();
  }

  /**
   * Opens login modal and runs callback once login succeeds.
   */
  private requireLogin(callback: () => void): boolean {
    if (!this.isGuest) return true;

    this.authModal.openLogin();
    this.authService.isLoggedIn$.pipe(
      filter(v => v),
      take(1),
    ).subscribe(() => callback());
    return false;
  }

  /* ─── Add To Cart (guest + logged-in) ─── */

  addToCart(product: any): void {
    product.qty = (product.qty || 0) + 1;

    if (this.isGuest) {
      const result = this.cartService.addToCartGuest(product);
      product.qty = result.quantity;
      this.headerService.updateCountsManually({
        cart_count: result.totalItems,
        subscription_count: 0,
      });
      // this.toastr.success('Added to cart');
      return;
    }

    this.cartService.addToCart({ product_id: product.id, quantity: 1 }).subscribe({
      next: (res) => {
        if (!res.success) return;
        if (res.action === 'removed') {
          product.qty = 0;
        } else if (res.item) {
          product.qty = res.item.quantity;
        }
        this.headerService.updateCartSummary(res.cart);
      },
      error: () => {
        product.qty = Math.max(0, (product.qty || 1) - 1);
      }
    });
  }

  /* ─── Increase Qty (guest + logged-in) ─── */

  increaseQty(product: any): void {
    const newQty = (product.qty || 0) + 1;
    product.qty = newQty;

    if (this.isGuest) {
      const result = this.cartService.updateCartItemGuest(product.id, newQty);
      product.qty = result.quantity;
      this.headerService.updateCountsManually({
        cart_count: result.totalItems,
        subscription_count: 0,
      });
      return;
    }

    this.cartService.updateCartItem(product.id, newQty).subscribe({
      next: (res) => {
        if (!res.success) return;
        if (res.item) {
          product.qty = res.item.quantity;
        }
        this.headerService.updateCartSummary(res.cart);
      },
      error: () => {
        product.qty = Math.max(0, product.qty - 1);
      }
    });
  }

  /* ─── Decrease Qty (guest + logged-in) ─── */

  decreaseQty(product: any): void {
    const currentQty = product.qty || 1;

    if (currentQty <= 1) {
      product.qty = 0;

      if (this.isGuest) {
        const totalItems = this.cartService.deleteCartItemGuest(product.id);
        this.headerService.updateCountsManually({
          cart_count: totalItems,
          subscription_count: 0,
        });
        return;
      }

      this.cartService.deleteCartItem(product.id).subscribe({
        next: () => this.headerService.fetchCounts(),
        error: () => { product.qty = 1; }
      });
      return;
    }

    const newQty = currentQty - 1;
    product.qty = newQty;

    if (this.isGuest) {
      const result = this.cartService.updateCartItemGuest(product.id, newQty);
      product.qty = result.quantity;
      this.headerService.updateCountsManually({
        cart_count: result.totalItems,
        subscription_count: 0,
      });
      return;
    }

    this.cartService.updateCartItem(product.id, newQty).subscribe({
      next: (res) => {
        if (!res.success) return;
        if (res.item) {
          product.qty = res.item.quantity;
        }
        this.headerService.updateCartSummary(res.cart);
      },
      error: () => {
        product.qty = currentQty;
      }
    });
  }

  /* ─── Subscribe (requires login for confirm) ─── */

  openSubscribeModal(product: any): void {
    const modalRef = this.ngbModal.open(SubscribeModalComponent, {
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.product = { ...product, qty: product.qty || 1 };
  }

  confirmSubscription(
    product: any,
    plan: string,
    startDate: string,
    quantity: number,
    modalRef?: any,
  ): void {
    if (!product) return;

    // Subscriptions always require a logged-in user
    if (this.isGuest) {
      modalRef?.dismiss();
      this.toastr.info('Please login to confirm subscription');
      this.authModal.openLogin();
      this.authService.isLoggedIn$.pipe(
        filter(v => v),
        take(1),
      ).subscribe(() => {
        this.openSubscribeModal(product);
      });
      return;
    }

    this.subscribeService
      .addSubscription(product, plan, startDate, quantity)
      .subscribe({
        next: () => {
          modalRef?.close();
          this.headerService.fetchCounts();
          // this.toastr.success('Subscription added successfully!');
        },
        error: (err: any) => {
          this.toastr.error(err.error?.message, 'Subscription Failed');
        },
      });
  }

  /** Merge guest cart quantities into product array (for pages to call after loading products) */
  syncProductQuantities(products: any[]): void {
    this.cartService.mergeGuestQty(products);
  }
}
