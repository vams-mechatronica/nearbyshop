import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
@Component({
  standalone:true,
  selector: 'app-products',
  templateUrl: './products.component.html',
  imports: [CommonModule,FormsModule]
})
export class ProductsComponent {
  products = [
  { id: 1, name: 'Product A', price: 100, qty: 0 },
  { id: 2, name: 'Product B', price: 150, qty: 0 },
  // etc.
];

  selectedProduct: any;
  subscriptionPlan = 'daily';
  startDate: string = '';

  constructor(
    private cartService: CartService,
    private modal: NgbModal
  ) {}

  addToCart(product: any) {
    product.qty = 1;
    this.cartService.addToCart(product);
  }

  subscribe(product: any) {
    this.selectedProduct = product;
    this.modal.open('subscribeModal');
  }

  confirmSubscription() {
    this.cartService.addSubscription(this.selectedProduct, this.subscriptionPlan, this.startDate);
  }
}
