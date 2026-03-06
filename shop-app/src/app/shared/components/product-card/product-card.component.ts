import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartActionsService } from '../../services/cart-actions.service';

@Component({
  standalone: true,
  selector: 'app-product-card',
  imports: [CommonModule, RouterLink],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss'],
})
export class ProductCardComponent {
  @Input() product: any;
  @Input() showVendor = true;
  @Input() compact = false;

  constructor(public cartActions: CartActionsService) {}

  onAddToCart(e: Event): void {
    e.stopPropagation();
    e.preventDefault();
    this.cartActions.addToCart(this.product);
  }

  onIncrease(e: Event): void {
    e.stopPropagation();
    e.preventDefault();
    this.cartActions.increaseQty(this.product);
  }

  onDecrease(e: Event): void {
    e.stopPropagation();
    e.preventDefault();
    this.cartActions.decreaseQty(this.product);
  }

  onSubscribe(e: Event): void {
    e.stopPropagation();
    e.preventDefault();
    this.cartActions.openSubscribeModal(this.product);
  }
}
