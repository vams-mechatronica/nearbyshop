import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductsService } from '../../services/products.service';

@Component({
  standalone: true,
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
  imports: [CommonModule, FormsModule]
})
export class ProductsComponent implements OnInit {
  products: any[] = [];
  categoryName: string = 'Darity';

  selectedProduct: any;
  subscriptionPlan = 'daily';
  startDate: string = '';

  constructor(
    private cartService: CartService,
    private productService: ProductsService,
    private route: ActivatedRoute,
    private modal: NgbModal
  ) { }

  ngOnInit(): void {
    const categorySlug = this.route.snapshot.paramMap.get('slug');
    if (categorySlug) {
      this.categoryName = categorySlug; 
      this.productService.getProductsByCategorySlug(categorySlug).subscribe((res: any) => {
        this.products = res.results;
      });
    } else {
      this.productService.getProducts().subscribe((res: any) => {
        this.products = res.results;
      });
    }
  }

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


  increaseQty(product: any): void {
    product.qty += 1;
  }

  decreaseQty(product: any): void {
    if (product.qty > 1) {
      product.qty -= 1;
    } else {
      product.qty = 0; // Reset to allow Buy Now button again
    }
  }

  openSubscribeModal(product: any, modalRef: any) {
    this.selectedProduct = { ...product }; // clone product to avoid direct mutation
    // Ensure at least qty = 1 when opening the modal
    if (!this.selectedProduct.qty || this.selectedProduct.qty < 1) {
      this.selectedProduct.qty = 1;
    }
    this.modal.open(modalRef, {
      centered: true,
      size: 'md',
      backdrop: 'static',
    });
  }

}
