import { CommonModule, TitleCasePipe } from '@angular/common';
import { Component, Injectable, OnInit, TemplateRef, ViewChild } from '@angular/core';
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
import { OrderService } from '../../services/order.service';
import { Order } from '../../models/order.model';
import { CartService } from '../../services/cart.service';
import { BankService } from '../../services/bank.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
declare var Razorpay: any;

interface BankForm {
  account_holder_name: string;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
}

@Component({
  selector: 'app-user-info',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular],
  styleUrls: ['./user-info.component.scss'],
  templateUrl: './user-info.component.html'
})
@Injectable({
  providedIn: 'root'
})

export class UserProfileComponent implements OnInit {
  activeTab: string = 'profile';
  showAddFundsModal = false;
  showBankModal = false;
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
  orders: Order[] = [];
  bank: any = {};
  cart: any[] = [];
  selectedOrder: any;
  transactions: any[] = [];
  loading = false;

  // Form model
  bankForm: BankForm = {
    account_holder_name: '',
    bank_name: '',
    account_number: '',
    ifsc_code: ''
  };


  constructor(private userService: UserService,
    private toast: ToastrService,
    private walletService: WalletService,
    private subscribeService: SubscriptionService,
    private orderService: OrderService,
    private paymentService: PaymentService,
    private cartService: CartService,
    private bankService: BankService,
    private modalService: NgbModal,
  ) { }
  @ViewChild('orderItemsModal') orderItemsModal!: TemplateRef<any>;



  ngOnInit(): void {
    this.getUserInfo();
    this.getWalletBalance();
    this.getSubscriptions();
    this.getOrderHistory();
    this.getBankDetails();
    this.getCartItems();
    this.getWalletTransactions();
  }


  getStatusBadgeClass(status: string) {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-success text-white';
      case 'pending': return 'bg-warning text-dark';
      case 'cancelled': return 'bg-danger text-white';
      case 'processing': return 'bg-primary text-white';
      default: return 'bg-secondary text-white';
    }
  }

  getSubscriptionBadgeClass(status: string) {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-success text-white';
      case 'pending': return 'bg-warning text-dark';
      case 'expired': return 'bg-danger text-white';
      default: return 'bg-secondary text-white';
    }
  }

  getPaymentMethodLabel(method: string): string {
    if (!method) return '-';

    if (method.toLowerCase() === 'cod') {
      return 'CASH ON DELIVERY';
    }

    return method.toUpperCase();
  }


  getUserInfo() {
    this.userService.getUserInfo().subscribe({
      next: (res: UserInfo) => {
        this.user = res;
      },
      error: (err) => {
        // const errorMsg =
        //   err?.error?.message || err?.error?.detail || err?.message || 'Something went wrong';
        // this.toast.error(errorMsg, 'Failed', {
        //   closeButton: true,   // adds dismiss (x) button
        //   progressBar: true,   // shows progress bar until auto-hide
        //   timeOut: 5000
        // });
      },
    });
  }

  openOrderItems(order: any) {
    this.selectedOrder = order;
    this.modalService.open(this.orderItemsModal, { centered: true, size: 'lg' });
  }

  getWalletBalance() {
    this.walletService.getWalletBalance().subscribe({
      next: (res: Wallet) => {
        this.wallet = res;
      },
      error: (err) => {
        // const errorMsg =
        //   err?.error?.message || err?.error?.detail || err?.message || 'Something went wrong';
        // this.toast.error(errorMsg, 'Failed');
      }
    });
  }

  getSubscriptions() {
    this.subscribeService.getSubscriptions().subscribe({
      next: (res: SubscriptionResponse) => {
        this.subscriptions = res?.results;
      },
      error: (err) => {
        // const errorMsg =
        //   err?.error?.message || err?.error?.detail || err?.message || 'Something went wrong';
        // this.toast.error(errorMsg, 'Failed');
      }
    })
  }

  getOrderHistory() {
    this.orderService.getOrderHistory().subscribe({
      next: (res: any) => {
        this.orders = res?.results;
      },
      error: (err) => {
        // const errorMsg =
        //   err?.error?.message || err?.error?.detail || err?.message || 'Something went wrong';
        // this.toast.error(errorMsg, 'Failed');
      }
    })
  }
  getBankDetails() {
    this.userService.getUserBankDetails().subscribe({
      next: (res: any) => {
        this.bank = res?.results;
      },
      error: (err) => {
        // const errorMsg =
        //   err?.error?.message || err?.error?.detail || err?.message || 'Something went wrong';
        // this.toast.error(errorMsg, 'Failed');
      }
    })
  }

  getCartItems() {
    this.cartService.getCart().subscribe({
      next: (res: any) => {
        this.cart = res?.results;
      },
      error: (err) => {
        // const errorMsg =
        //   err?.error?.message || err?.error?.detail || err?.message || 'Something went wrong';
        // this.toast.error(errorMsg, 'Failed');
      }
    })
  }

  getWalletTransactions() {
    this.userService.getUserWalletTransactions().subscribe(
      {
        next: (res: any) => {
          this.transactions = res?.results;
        },
        error: (err) => {
          // const errorMsg =
          //   err?.error?.message || err?.error?.detail || err?.message || 'Something went wrong';
          // this.toast.error(errorMsg, 'Failed');
        }
      }
    )
  }
  // Bank Details Modal
  // For editing an existing bank (optional)
  // bank: BankForm | null = null;

  // Open modal (optionally with existing data)
  openBankModal(bank?: BankForm) {
    this.showBankModal = true;

    if (bank) {
      this.bank = bank;
      this.bankForm = { ...bank }; // pre-fill form for editing
    } else {
      this.bank = null;
      this.bankForm = { account_holder_name: '', bank_name: '', account_number: '', ifsc_code: '' }; // reset form
    }
  }
  closeBankModal() {
    this.showBankModal = false;
  }

  // Save data (you can replace with API call)
  saveBankDetails() {
    if (!this.bankForm.account_holder_name || !this.bankForm.bank_name || !this.bankForm.account_number || !this.bankForm.ifsc_code) {
      alert('All fields are required!');
      return;
    }

    if (this.bank) {
      this.bankService.addBankDetail(this.bankForm).subscribe({
        next: (res) => {
          this.toast.success('Bank details updated successfully!', 'Success');
        },
        error: (err) => {
          // const errorMsg =
          //   err?.error?.message || err?.error?.detail || err?.message || 'Something went wrong';
          // this.toast.error(errorMsg, 'Failed');
        }
      });
    }
    this.closeBankModal();
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
    this.loading = true;
    if (!this.amount || this.amount < 100) {
      this.toast.error('Minimum recharge is ₹100');
      this.loading = false;
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
            this.loading = false;
            this.toast.success('Wallet recharged successfully!', 'Recharge Success');
            this.getWalletBalance();
            this.closeAddFundsModal();
          });
        }
      };
      const rzp = new Razorpay(options);
      rzp.open();
    });
    this.loading = false;
  }

  // Column definitions
  orderCols: ColDef[] = [
    { headerName: '#', valueGetter: (p) => (p.node?.rowIndex ?? 0) + 1 },
    { headerName: 'Date', field: 'created_at' },
    { headerName: 'Items', field: 'items' },
    { headerName: 'PaymentMethod', field: 'payment_method' },
    { headerName: 'Status', field: 'status' },
    { headerName: 'Total (₹)', field: 'total_price' },
  ];

  txnCols: ColDef[] = [
    { headerName: '#', valueGetter: (p) => (p.node?.rowIndex ?? 0) + 1, width: 100 },
    {
      headerName: 'Date',
      field: 'timestamp',
      width: 250,
      valueFormatter: (params) => {
        if (!params.value) return '';
        // Convert to Date object
        const date = new Date(params.value);
        // Format using toLocaleString including timezone
        return date.toLocaleString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZoneName: 'short'
        });
      }
    },
    { headerName: 'Amount (₹)', field: 'amount', width: 150 },
    { headerName: 'Type', field: 'transaction_type', width: 100 },
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
    { headerName: 'Qty', field: 'quantity', width: 60 },
    { headerName: 'Frequency', field: 'frequency' },
    { headerName: 'Price', field: 'price', width: 100 },
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
    { headerName: 'Name', field: 'product.name' },
    { headerName: 'Qty', field: 'quantity' },
    { headerName: 'Price (₹)', field: 'price' },
  ];


  gridOptions = {
    pagination: true,
    paginationPageSize: 10,
    domLayout: 'normal',
  };

  // bank = {
  //   // bankName: 'HDFC Bank',
  //   // accountNumber: 'XXXX1234',
  //   // ifsc: 'HDFC0001234'
  // };
  refundCols: ColDef[] = [
    { headerName: '#', valueGetter: (p) => (p.node?.rowIndex ?? 0) + 1, width: 100 },
    { headerName: 'Date Refunded', field: 'date', width: 300 },
    { headerName: 'Amount (₹)', field: 'amount', width: 200 },
    { headerName: 'Status', field: 'status', width: 200 },
  ];
  // refunds = [
  //   { date: '2025-08-12', amount: 300, status: 'Processed' }
  // ];


  tracking = [
    { orderId: 101, status: 'Shipped', updated: '2025-08-27' },
    { orderId: 102, status: 'Out for Delivery', updated: '2025-08-28' }
  ];

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
  showEditProfile = false;

  editProfile = {
    username: '',
    email: ''
  };

  openEditProfile() {
    this.editProfile = {
      username: this.user.username,
      email: this.user.email
    };
    this.showEditProfile = true;
  }

  closeEditProfile() {
    this.showEditProfile = false;
  }

  saveProfile() {
    const payload = {
      username: this.editProfile.username,
      email: this.editProfile.email
    };


    this.userService.updateProfile(payload).subscribe({
      next: (res) => {
        this.user = {
          ...this.user,
          username: res.username,
          email: res.email
        };

        this.closeEditProfile();
      },
      error: (err) => {
        const errorMsg =
          err?.error?.email || err?.error?.username || 'Something went wrong';
        this.toast.error(errorMsg, 'Error');
        // console.error('Profile update failed', err);
      }
    });
  }

}
