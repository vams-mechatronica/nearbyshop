import { Component } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-subscribe',
  templateUrl: './subscribe.component.html',
  styleUrls: ['./subscribe.component.scss'],
  imports: [CommonModule] // ✅ Add this
})
export class SubscribeComponent {
  subscriptions: any[] = [];

  constructor(private cartService: CartService) {
    this.subscriptions = this.cartService.getSubscriptions();
  }
}
