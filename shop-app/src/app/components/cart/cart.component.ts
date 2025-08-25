import { Component, OnInit } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive]
})
export class CartComponent implements OnInit {
  cartItems: any[] = [];
  user = { mobile: '', otp: '', address: '' };

  constructor(private cartService: CartService) {
  }

  ngOnInit(): void {
    this.loadCart();
  }

  sendOTP() {
    alert('OTP sent to ' + this.user.mobile);
  }

  placeOrder() {
    console.log('Order placed:', this.cartItems, this.user);
  }

  getTotal() {
    return this.cartItems.reduce((sum, item) => sum + item.qty * item.price, 0);
  }

  removeItem(item: any) {
    this.cartItems = this.cartItems.filter(i => i !== item);
  }

  loadCart() {
    this.cartService.getCart().subscribe({
      next: (data) => {
        this.cartItems = data.items || data;
      },
      error: (err) => {
        console.error('Error fetching cart:', err);
      }
    });
  }

}
