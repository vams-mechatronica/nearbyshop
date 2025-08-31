import { Component, OnInit } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { hasToken } from '../../shared/utility/utils.common';
import { UserService } from '../../services/user.service';
import { ToastrService } from 'ngx-toastr';
import { AddDeliveryAddress } from '../../models/user.model';
import { InitiatePayment, InitiatePaymentOrder } from '../../models/payment.model';
import { PaymentService } from '../../services/payment.service';
import { Order } from '../../models/order.model';

declare var Razorpay: any;


@Component({
  standalone: true,
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
  imports: [CommonModule, FormsModule, RouterLink]
})
export class CartComponent implements OnInit {
  cartItems: any[] = [];
  gTotal: number = 0;
  cartId: number = 0;

  // User + Address
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
  // paymentService: any;

  constructor(private cartService: CartService,
    private userService: UserService,
    private toastrService: ToastrService,
    private paymentService: PaymentService
  ) { }

  ngOnInit(): void {
    this.loadCart();
    this.loadAddresses();
  }

  showAddressModal: boolean = false;

  openAddressModal() {
    this.showAddressModal = true;
  }

  closeAddressModal() {
    this.showAddressModal = false;
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
    if (hasToken()) {
      this.cartService.deleteCartItem(item.product.id).subscribe({
        next: (res) => {
          this.loadCart();
        },
        error: (err) => {
          console.log('Error Deleting the Cart Item', err);
        }
      })
    } else {

    }
  }

  increaseQuantity(item: any) {
    item.quantity++;

    this.cartService.updateCartItem(item.product.id, item.quantity).subscribe({
      next: (res) => {
        console.log('Successfully updated cart', res);
        this.loadCart();  // 🔥 refresh only after success
      },
      error: (err) => {
        console.log('Error updating cart', err);
        // rollback in case of failure
        item.quantity--;
      }
    });
  }


  decreaseQuantity(item: any) {
    if (item.quantity > 1) {
      item.quantity--;
      this.cartService.updateCartItem(item.product.id, item.quantity).subscribe({
        next: (res) => {
          console.log('Successfully updated cart', res);
          this.loadCart();  // 🔥 refresh only after success
        },
        error: (err) => {
          console.log('Error updating cart', err);
          // rollback in case of failure
          item.quantity++;
        }
      });
    }
  }

  // ========== OTP / ORDER ==========
  sendOTP() {
    alert('OTP sent to ' + this.user.mobile);
  }

  placeOrder() {
    console.log('Order placed:', this.cartItems, this.user, this.selectedAddress);
  }

  // ========== ADDRESS MGMT ==========
  loadAddresses() {
    if (hasToken()) {
      this.userService.getUserAddress().subscribe({
        next: (res: any) => {
          this.addresses = res?.results || [];

          // Try to restore selectedAddress from localStorage
          const stored = localStorage.getItem('selectedAddress');
          if (stored) {
            const saved = JSON.parse(stored);
            // Match with current API addresses (by id)
            this.selectedAddress = this.addresses.find(a => a.id === saved.id) || null;
          }

          // If nothing selected yet, auto-select first address
          if (!this.selectedAddress && this.addresses.length > 0) {
            this.setSelectedAddress(this.addresses[0]);
          }
        },
        error: () => {
          this.toastrService.error('Error in fetching address', 'Error');
        }
      });
    } else {
      const stored = localStorage.getItem('addresses');
      if (stored) {
        this.addresses = JSON.parse(stored);
      }

      const selected = localStorage.getItem('selectedAddress');
      if (selected) {
        this.selectedAddress = JSON.parse(selected);
      }

      // If nothing selected, auto-select first saved address
      if (!this.selectedAddress && this.addresses.length > 0) {
        this.setSelectedAddress(this.addresses[0]);
      }
    }
  }

  setSelectedAddress(address: any) {
    this.selectedAddress = address;
    localStorage.setItem('selectedAddress', JSON.stringify(address));
  }

  addAddress() {
    // Basic validation
    if (!this.newAddress.name || !this.newAddress.address) return;

    const addressPayload: AddDeliveryAddress = {
      name: this.newAddress.name,
      address_line: this.newAddress.address,
      city: this.newAddress.city,
      state: this.newAddress.state,
      zip_code: this.newAddress.zip,
      phone_number: this.newAddress.phone,
    };

    if (hasToken()) {
      // Logged in: save via API
      this.userService.addUserAddress(addressPayload).subscribe({
        next: (res) => {
          // Add to addresses list
          this.addresses.push(res);

          // Select newly added
          this.setSelectedAddress(res);

          this.toastrService.success('Address added successfully', 'Success');

          // Reset form
          this.newAddress = { name: '', address: '', city: '', state: '', zip: '', phone: '' };

          this.loadAddresses();
        },
        error: () => {
          this.toastrService.error('Failed to add address', 'Error');
        }
      });
    } else {
      // Guest user: store in localStorage
      this.addresses.push(addressPayload);

      localStorage.setItem('addresses', JSON.stringify(this.addresses));
      this.setSelectedAddress(addressPayload);

      this.toastrService.info('Address saved locally', 'Guest Mode');

      this.newAddress = { name: '', address: '', city: '', state: '', zip: '', phone: '' };
      this.loadAddresses();
    }
  }



  selectAddress(index: number) {
    this.selectedAddress = this.addresses[index];
    localStorage.setItem('selectedAddress', JSON.stringify(this.selectedAddress));
  }

  checkout(address: any) {
    this.cartService.createOrder(this.cartId,address.id,'razorpay',null).subscribe({
      next: (res: Order) => {
        this.paymentRazorpay(res.total_price, res.id);
      },
      error: (err) => {this.toastrService.error('Failed to order', 'Error');}
    });
    
  }

  paymentRazorpay(amount: any, orderId: number){

    this.paymentService.createCartPaymentOrder(amount, orderId).subscribe((order: InitiatePaymentOrder) => {
      const options = {
        key: order.razorpay_key,
        amount: order.amount,
        currency: order.currency,
        name: 'Payment Order',
        description: 'Checkout cart items payment',
        order_id: order.razorpay_order_id,
        handler: (response: any) => {
          this.paymentService.verifyCartPaymentOrder(response).subscribe(() => {
            this.toastrService.success('Payment successful!', 'Success');
          });
        }
      };
      const rzp = new Razorpay(options);
      rzp.open();
    });
  }

}
