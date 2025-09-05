import { Component, Injectable, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { hasToken } from '../../shared/utility/utils.common';
import { UserService } from '../../services/user.service';
import { ToastrService } from 'ngx-toastr';
import { AddDeliveryAddress } from '../../models/user.model';
import { InitiatePaymentOrder } from '../../models/payment.model';
import { PaymentService } from '../../services/payment.service';
import { Order } from '../../models/order.model';
import { StorageService } from '../../services/storage.service';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthComponent } from '../auth/auth.component';
import { LoaderService } from '../../services/loader.service';

declare var Razorpay: any;

@Component({
  standalone: true,
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
  imports: [CommonModule, FormsModule, RouterLink]
})
@Injectable({ providedIn: 'root' })
export class CartComponent implements OnInit {
  cartItems: any[] = [];
  gTotal: number = 0;
  cartId: number = 0;

  user = { mobile: '', otp: '', address: '' };
  addresses: any[] = [];
  selectedAddress: any = null;

  newAddress = {
    name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: ''
  };

  showAddressModal: boolean = false;

  constructor(
    private cartService: CartService,
    private userService: UserService,
    private toastrService: ToastrService,
    private storage: StorageService,
    private paymentService: PaymentService,
    private authService: AuthService,
    private router: Router,
    private modalService: NgbModal,
    private loaderService: LoaderService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    this.loadCart();

    if (isPlatformBrowser(this.platformId)) {
      this.loadAddresses(); // browser-only
    }
  }

  // ========== CART ==========
  loadCart() {
    this.cartService.getCart().subscribe({
      next: (data) => {
        this.cartItems = data.items || data;
        this.gTotal = data.total ? parseFloat(data.total) : this.getTotal();
        this.cartId = data.id;
      },
      error: (err) => {
        console.error('Error fetching cart:', err);
      }
    });
  }

  getTotal() {
    return this.cartItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  }

  removeItem(item: any) {
    // if (this.authService.hasToken()) {
    this.cartService.deleteCartItem(item.product.id).subscribe({
      next: () => this.loadCart(),
      error: (err) => console.log('Error Deleting the Cart Item', err)
    });
    // }
  }

  increaseQuantity(item: any) {
    item.quantity++;
    this.cartService.updateCartItem(item.product.id, item.quantity).subscribe({
      next: () => this.loadCart(),
      error: () => item.quantity--
    });
  }

  decreaseQuantity(item: any) {
    if (item.quantity > 1) {
      item.quantity--;
      this.cartService.updateCartItem(item.product.id, item.quantity).subscribe({
        next: () => this.loadCart(),
        error: () => item.quantity++
      });
    }
  }

  // ========== OTP / ORDER ==========
  sendOTP() {
    if (isPlatformBrowser(this.platformId)) {
      alert('OTP sent to ' + this.user.mobile);
    }
  }

  placeOrder() {
    console.log('Order placed:', this.cartItems, this.user, this.selectedAddress);
  }

  // ========== ADDRESS MANAGEMENT ==========
  openAddressModal() { this.showAddressModal = true; }
  closeAddressModal() { this.showAddressModal = false; }

  loadAddresses() {
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.authService.hasToken()) {
      this.userService.getUserAddress().subscribe({
        next: (res: any) => {
          this.addresses = res?.results || [];
          const stored = this.storage.getItem('selectedAddress');
          if (stored) {
            const saved = JSON.parse(stored);
            this.selectedAddress = this.addresses.find(a => a.id === saved.id) || null;
          }
          if (!this.selectedAddress && this.addresses.length > 0) {
            this.setSelectedAddress(this.addresses[0]);
          }
        },
        error: () => this.toastrService.error('Error in fetching address', 'Error')
      });
    } else {
      const storedAddresses = this.storage.getItem('addresses');
      if (storedAddresses) this.addresses = JSON.parse(storedAddresses);
      const selected = this.storage.getItem('selectedAddress');
      if (selected) this.selectedAddress = JSON.parse(selected);
      if (!this.selectedAddress && this.addresses.length > 0) this.setSelectedAddress(this.addresses[0]);
    }
  }

  setSelectedAddress(address: any) {
    if (!isPlatformBrowser(this.platformId)) return;
    this.selectedAddress = address;
    this.storage.setItem('selectedAddress', JSON.stringify(address));
  }

  addAddress() {
    if (!this.newAddress.name || !this.newAddress.address) return;

    const addressPayload: AddDeliveryAddress = {
      name: this.newAddress.name,
      address_line: this.newAddress.address,
      city: this.newAddress.city,
      state: this.newAddress.state,
      zip_code: this.newAddress.zip,
      phone_number: this.newAddress.phone,
    };

    if (!isPlatformBrowser(this.platformId)) return;

    if (this.authService.hasToken()) {
      this.userService.addUserAddress(addressPayload).subscribe({
        next: (res) => {
          this.addresses.push(res);
          this.setSelectedAddress(res);
          this.toastrService.success('Address added successfully', 'Success');
          this.newAddress = { name: '', address: '', city: '', state: '', zip: '', phone: '' };
          this.loadAddresses();
        },
        error: () => this.toastrService.error('Failed to add address', 'Error')
      });
    } else {
      this.addresses.push(addressPayload);
      this.storage.setItem('addresses', JSON.stringify(this.addresses));
      this.setSelectedAddress(addressPayload);
      this.toastrService.info('Address saved locally', 'Guest Mode');
      this.newAddress = { name: '', address: '', city: '', state: '', zip: '', phone: '' };
      this.loadAddresses();
    }
  }

  selectAddress(index: number) {
    if (!isPlatformBrowser(this.platformId)) return;
    this.selectedAddress = this.addresses[index];
    this.storage.setItem('selectedAddress', JSON.stringify(this.selectedAddress));
  }

  checkout(address: any) {
    // this.loaderService.show();
    if (!this.authService.hasToken()) {
      // 🔑 User not logged in → show login modal
      const modalRef = this.modalService.open(AuthComponent, { backdrop: 'static', keyboard: false });

      // ⏳ When modal closes, retry checkout if login was successful
      modalRef.closed.subscribe((result) => {
        if (result === 'logged-in') {
          this.cartService.syncGuestCart().subscribe();
          // this.loaderService.hide();
          this.checkout(address); // 🔁 Retry with same address
        }
      });

      return;
    }

    if (!address){
      this.toastrService.error('Please Enter delivery address','Failed');
      return;
    }
    // ✅ Logged in → proceed with order
    this.cartService.createOrder(this.cartId, address.id, 'razorpay', null).subscribe({
      next: (res: Order) => this.paymentRazorpay(res.total_price, res.id),
      error: () => {
        if (isPlatformBrowser(this.platformId)) {
          this.toastrService.error('Failed to order', 'Error');
        }
      }
    });
  }


  paymentRazorpay(amount: any, orderId: number) {
    if (!isPlatformBrowser(this.platformId)) return;

    this.paymentService.createCartPaymentOrder(amount, orderId).subscribe((order: InitiatePaymentOrder) => {
      const options = {
        key: order.razorpay_key,
        amount: order.amount,
        currency: order.currency,
        name: 'Payment Order',
        description: 'Checkout cart items payment',
        order_id: order.razorpay_order_id,
        handler: (response: any) => {
          this.paymentService.verifyCartPaymentOrder(response).subscribe({
            next: () => this.router.navigate(['/payment-status'], { queryParams: { status: 'success', orderId } }),
            error: () => this.router.navigate(['/payment-status'], { queryParams: { status: 'failed', orderId } })
          });
        }
      };
      const rzp = new Razorpay(options);
      rzp.open();
    });
  }
}
