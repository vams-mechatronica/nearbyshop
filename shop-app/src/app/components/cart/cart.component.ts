import { Component } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  standalone:true,
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  imports: [CommonModule,FormsModule]
})
export class CartComponent {
  cartItems: any[] = [];
  user = { mobile: '', otp: '', address: '' };

  constructor(private cartService: CartService) {
    this.cartItems = this.cartService.getCart();
  }

  sendOTP() {
    alert('OTP sent to ' + this.user.mobile);
  }

  placeOrder() {
    console.log('Order placed:', this.cartItems, this.user);
    localStorage.removeItem('cart');
  }
}
