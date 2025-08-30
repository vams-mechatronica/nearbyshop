import { CommonModule, TitleCasePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UserService } from '../../services/user.service';
import { UserInfo } from '../../models/user.model';
import { ToastrService } from 'ngx-toastr';
import { Wallet } from '../../models/wallet.model';
import { WalletService } from '../../services/wallet.service';
import { AgGridAngular } from 'ag-grid-angular';
import type { ColDef } from 'ag-grid-community';
import { Subscription, SubscriptionResponse } from '../../models/subscribe.model';
import { SubscriptionService } from '../../services/subscribe.service';
import { PaymentService } from '../../services/payment.service';
import { InitiatePayment } from '../../models/payment.model';
declare var Razorpay: any;
@Component({
  selector: 'app-user-info',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular],
  styleUrls: ['./user-info.component.scss'],
  templateUrl: './user-info.component.html'
})
export class UserProfileComponent implements OnInit {
  activeTab: string = 'profile';
  showAddFundsModal = false;
  amount = 0;
  user: UserInfo = {
    id: 0,
    username: '',
    email: 'string',
    phone_number: '',
    role: '',
    is_phone_verified: true,
    is_email_verified: true,
    customerprofile: null,
    vendorprofile: null,
    bdaprofile: null
  };

  wallet: Wallet = {
    balance: 0
  }
  subscriptions: Subscription[] = [];


  constructor(private userService: UserService,
    private toast: ToastrService,
    private walletService: WalletService,
    private subscribeService: SubscriptionService,
    private paymentService: PaymentService
  ) { }


  ngOnInit(): void {
    this.getUserInfo();
    this.getWalletBalance();
    this.getSubscriptions();
  }

  getUserInfo() {
    this.userService.getUserInfo().subscribe({
      next: (res: UserInfo) => {
        this.user = res;
      },
      error: (err) => {
        const errorMsg =
          err?.error?.message || err?.error?.detail || err?.message || 'Something went wrong';
        this.toast.error(errorMsg, 'Failed', {
          closeButton: true,   // adds dismiss (x) button
          progressBar: true,   // shows progress bar until auto-hide
          timeOut: 5000
        });
      },
    });
  }

  getWalletBalance() {
    this.walletService.getWalletBalance().subscribe({
      next: (res: Wallet) => {
        this.wallet = res;
      },
      error: (err) => {
        const errorMsg =
          err?.error?.message || err?.error?.detail || err?.message || 'Something went wrong';
        this.toast.error(errorMsg, 'Failed');
      }
    });
  }

  getSubscriptions() {
    this.subscribeService.getSubscriptions().subscribe({
      next: (res: SubscriptionResponse) => {
        this.subscriptions = res?.results;
      },
      error: (err) => {
        const errorMsg =
          err?.error?.message || err?.error?.detail || err?.message || 'Something went wrong';
        this.toast.error(errorMsg, 'Failed');
      }
    })
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
            this.getWalletBalance();
            this.closeAddFundsModal();
          });
        }
      };
      const rzp = new Razorpay(options);
      rzp.open();
    });
  }


  orders = [
    { date: '2025-08-10', items: 'Milk, Bread', status: 'Delivered', total: 350 },
    { date: '2025-08-15', items: 'Eggs, Butter', status: 'Pending', total: 220 },
  ];

  transactions = [
    { date: '2025-08-01', amount: 500, type: 'Credit' },
    { date: '2025-08-05', amount: 300, type: 'Debit' },
  ];

  cart = [
    { name: 'Apples', qty: 2, price: 150 },
    { name: 'Rice', qty: 1, price: 500 },
  ];

  // Column definitions
  orderCols: ColDef[] = [
    { headerName: '#', valueGetter: (p) => (p.node?.rowIndex ?? 0) + 1 },
    { headerName: 'Date', field: 'date' },
    { headerName: 'Items', field: 'items' },
    { headerName: 'Status', field: 'status' },
    { headerName: 'Total (₹)', field: 'total' },
  ];

  txnCols: ColDef[] = [
    { headerName: '#', valueGetter: (p) => (p.node?.rowIndex ?? 0) + 1 },
    { headerName: 'Date', field: 'date' },
    { headerName: 'Amount (₹)', field: 'amount' },
    { headerName: 'Type', field: 'type' },
  ];

  subCols: ColDef[] = [
    // { headerName: '#', valueGetter: (p) => (p.node?.rowIndex ?? 0) + 1 },
    {
      headerName: 'Image',
      field: 'product.image',
      cellRenderer: (params: any) => {
        if (params.value) {
          return `<img src="${params.value}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;" />`;
        }
        return '';
      },
      width: 80, // adjust to fit image properly
    },
    { headerName: 'Name', field: 'product.name' },
    { headerName: 'Qty', field: 'quantity' ,width: 60},
    { headerName: 'Frequency', field: 'frequency' },
    { headerName: 'Price', field: 'price' ,width:100},
    {
      headerName: 'Status',
      field: 'status',
      cellRenderer: (params: any) => {
        const value = params.value?.toLowerCase();
        if (value === 'active') {
          return `<span class="badge bg-success">Active</span>`;
        } else {
          return `<span class="badge bg-danger">${params.value || 'Inactive'}</span>`;
        }
      },
      width: 120
    },
    { headerName: 'Started', field: 'start_date' },
    { headerName: 'Expiry', field: 'end_date' },
    { headerName: 'Created At', field: 'created_at' },
    { headerName: 'Updated At', field: 'updated_at' },
  ];


  cartCols: ColDef[] = [
    { headerName: '#', valueGetter: (p) => (p.node?.rowIndex ?? 0) + 1 },
    { headerName: 'Name', field: 'name' },
    { headerName: 'Qty', field: 'qty' },
    { headerName: 'Price (₹)', field: 'price' },
  ];


  gridOptions = {
    pagination: true,
    paginationPageSize: 10,
    domLayout: 'normal',
  };

  bank = {
    bankName: 'HDFC Bank',
    accountNumber: 'XXXX1234',
    ifsc: 'HDFC0001234'
  };

  refunds = [
    { date: '2025-08-12', amount: 300, status: 'Processed' }
  ];

  tracking = [
    { orderId: 101, status: 'Shipped', updated: '2025-08-27' },
    { orderId: 102, status: 'Out for Delivery', updated: '2025-08-28' }
  ];

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
}
