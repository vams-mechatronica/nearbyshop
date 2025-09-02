import { Component, Injectable, OnInit, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';

import { SubscriptionService } from '../../services/subscribe.service';
import { WalletService } from '../../services/wallet.service';
import { PaymentService } from '../../services/payment.service';

import { Subscription } from '../../models/subscribe.model';
import { InitiatePayment } from '../../models/payment.model';
import { SubFilterPipe } from '../../shared/utility/subfilter.pipe';
import { StorageService } from '../../services/storage.service';

declare var Razorpay: any;

@Component({
  standalone: true,
  selector: 'app-subscriptions',
  templateUrl: './subscribe.component.html',
  styleUrls: ['./subscribe.component.scss'],
  imports: [CommonModule, FormsModule, SubFilterPipe]
})
@Injectable({
  providedIn: 'root'
})
export class SubscriptionsComponent implements OnInit {
  subscriptions: Subscription[] = [];
  selectedSubscription: Subscription | null = null;
  selectedAddress: any = {};
  walletBalance = 0;
  amount = 100;

  // modal state
  modalRef?: NgbModalRef;
  showAddFundsModal = false;

  // edit form fields
  subscriptionPlan = 'daily';
  startDate = '';
  subscriptionStatus: string = 'active';

  activeSubTab: string = 'active';

  constructor(
    private subscriptionService: SubscriptionService,
    private walletService: WalletService,
    private paymentService: PaymentService,
    private toast: ToastrService,
    private storage: StorageService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
    this.loadSubscriptions();
    this.loadWalletBalance();
    this.loadSelectedAddress();
  }

  // -------- Loaders ----------
  loadSubscriptions() {
    this.subscriptionService.getSubscriptions().subscribe({
      next: (res) => (this.subscriptions = res?.results || []),
      error: (err) => console.error('Failed to fetch subscriptions:', err),
    });
  }

  loadWalletBalance() {
    this.walletService.getWalletBalance().subscribe({
      next: (res: any) => (this.walletBalance = res.balance),
      error: (err) => console.error('Failed to fetch wallet balance:', err),
    });
  }

  loadSelectedAddress() {
    const selected = this.storage.getItem('selectedAddress');
    if (selected) {
      this.selectedAddress = JSON.parse(selected);
    }
  }

  // -------- Wallet ----------
  openAddFundsModal() {
    this.showAddFundsModal = true;
  }
  closeAddFundsModal() {
    this.showAddFundsModal = false;
    this.amount = 100;
  }
  setRechargeAmount(amount: number) {
    this.amount = amount;
  }
  rechargeNow() {
    if (!this.amount || this.amount < 100) {
      this.toast.error('Minimum recharge is ₹100');
      return;
    }

    this.paymentService.createOrder(this.amount).subscribe((order: InitiatePayment) => {
      const options = {
        key: order.razorpay_key,
        amount: order.amount,
        currency: order.currency,
        name: 'Wallet Recharge',
        description: 'Recharge your wallet',
        order_id: order.order_id,
        handler: (response: any) => {
          this.paymentService.verifyPayment(response).subscribe(() => {
            this.toast.success('Wallet recharged successfully!', 'Recharge Success');
            this.loadWalletBalance();
            this.closeAddFundsModal();
          });
        }
      };
      const rzp = new Razorpay(options);
      rzp.open();
    });
  }

  // -------- Subscription Edit ----------
  openSubscribeModal(sub: Subscription, modalTemplate: TemplateRef<any>) {
    this.selectedSubscription = { ...sub };
    this.subscriptionPlan = sub.frequency || 'daily';
    this.startDate = sub.start_date || new Date().toISOString().split('T')[0];
    this.subscriptionStatus = sub.status || 'active';

    this.modalRef = this.modalService.open(modalTemplate, {
      size: 'md',
      centered: true,
      backdrop: 'static'
    });
  }

  increaseQty() {
    if (this.selectedSubscription) this.selectedSubscription.quantity++;
  }
  decreaseQty() {
    if (this.selectedSubscription && this.selectedSubscription.quantity > 1) {
      this.selectedSubscription.quantity--;
    }
  }

  confirmSubscription() {
    if (!this.selectedSubscription) return;

    const payload = {
      quantity: this.selectedSubscription.quantity,
      frequency: this.subscriptionPlan,
      start_date: this.startDate,
      status: this.subscriptionStatus,
    };

    this.subscriptionService.updateSubscription(this.selectedSubscription.id, payload).subscribe({
      next: (res: Subscription) => {
        this.toast.success('Subscription updated successfully');
        const idx = this.subscriptions.findIndex(s => s.id === res.id);
        if (idx > -1) this.subscriptions[idx] = res;
        this.modalRef?.close();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Update failed');
      }
    });
  }

  pauseSubscription(sub: Subscription) {
    this.subscriptionService.pauseSubscription(sub.id, 'paused').subscribe({
      next: () => {
        this.toast.success('Subscription paused successfully', 'Subscription Paused');
        this.loadSubscriptions();
      },
      error: () => this.toast.error('Failed to pause subscription'),
    });
  }

  activateSubscription(sub: Subscription){
    this.subscriptionService.pauseSubscription(sub.id, 'active').subscribe({
      next: () => {
        this.toast.success('Subscription activated successfully', 'Subscription Activate');
        this.loadSubscriptions();
      },
      error: () => this.toast.error('Failed to activate subscription'),
    });
  }
}
