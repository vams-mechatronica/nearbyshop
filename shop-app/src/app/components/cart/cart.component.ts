import { Component, OnInit } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

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

  // User + Address
  user = { mobile: '', otp: '', address: '' };
  addresses: any[] = [];
  selectedAddress: any = null;

  newAddress = {
    name: '',
    address: '',
    city: '',
    state: '',
    zip: ''
  };

  constructor(private cartService: CartService) { }

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
    this.cartService.deleteCartItem(item.product.id).subscribe({
      next: (res) => {
        this.loadCart();
      },
      error: (err) => {
        console.log('Error Deleting the Cart Item', err);
      }
    })
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
    const stored = localStorage.getItem('addresses');
    if (stored) {
      this.addresses = JSON.parse(stored);
    }
    const selected = localStorage.getItem('selectedAddress');
    if (selected) {
      this.selectedAddress = JSON.parse(selected);
    }
  }

  addAddress() {
    if (!this.newAddress.name || !this.newAddress.address) return;
    this.addresses.push({ ...this.newAddress });
    localStorage.setItem('addresses', JSON.stringify(this.addresses));

    // Auto-select the new address
    this.selectedAddress = this.newAddress;
    localStorage.setItem('selectedAddress', JSON.stringify(this.selectedAddress));

    // Reset input form
    this.newAddress = { name: '', address: '', city: '', state: '', zip: '' };
    this.loadAddresses();
  }

  selectAddress(index: number) {
    this.selectedAddress = this.addresses[index];
    localStorage.setItem('selectedAddress', JSON.stringify(this.selectedAddress));
  }
}
