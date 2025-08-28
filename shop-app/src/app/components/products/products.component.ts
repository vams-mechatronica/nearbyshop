import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { ProductsService } from '../../services/products.service';
import { HttpErrorResponse } from '@angular/common/http';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
  imports: [CommonModule, FormsModule],
})
export class ProductsComponent implements OnInit {
  products: any[] = [];
  categoryName: string = 'Darity';

  selectedProduct: any;
  subscriptionPlan = 'daily';
  startDate: string = '';

  @ViewChild('subscribeModal') subscribeModal!: TemplateRef<any>;
  private subscribeModalRef!: NgbModalRef;

  categories = [
    { id: 1, name: 'Beauty & Salon', count: 3 },
    { id: 2, name: 'Restaurants', count: 1 },
    { id: 3, name: 'Spa & Massage', count: 34 },
  ];

  constructor(
    private cartService: CartService,
    private productService: ProductsService,
    private route: ActivatedRoute,
    private modal: NgbModal
  ) {}

  ngOnInit(): void {
    const categorySlug = this.route.snapshot.paramMap.get('slug');
    if (categorySlug) {
      this.categoryName = categorySlug;
      this.productService.getProductsByCategorySlug(categorySlug).subscribe({
        next: (res: any) => (this.products = res.results),
        error: (err) => console.error('Error fetching products:', err),
      });
    } else {
      this.productService.getProducts().subscribe({
        next: (res: any) => (this.products = res.results),
        error: (err) => console.error('Error fetching products:', err),
      });
    }
  }

  addToCart(product: any) {
    product.qty = 1;
    this.cartService.addToCart(product).subscribe({
      next: (res: any) => console.log('Added to cart:', res),
      error: (err: HttpErrorResponse) => console.error('Add to cart failed:', err),
    });
  }

  openSubscribeModal(product: any) {
    this.selectedProduct = { ...product, qty: product.qty || 1 };
    this.subscribeModalRef = this.modal.open(this.subscribeModal, {
      centered: true,
      backdrop: 'static',
    });
  }

  confirmSubscription() {
    if (!this.selectedProduct) return;

    this.cartService
      .addSubscription(
        this.selectedProduct,
        this.subscriptionPlan,
        this.startDate,
        this.selectedProduct.qty
      )
      .subscribe({
        next: (res) => {
          console.log('Subscription confirmed:', res);
          this.subscribeModalRef?.close(); // ✅ now reliably closes modal
        },
        error: (err) => console.error('Error creating subscription:', err),
      });
  }

  increaseQty(product: any): void {
    product.qty = (product.qty || 0) + 1;
    this.cartService.updateCartItem(product.id, product.qty).subscribe({
      next: (res) => console.log('Cart updated:', res),
      error: (err) => console.error('Cart update failed:', err),
    });
  }

  decreaseQty(product: any): void {
    if ((product.qty || 1) > 1) {
      product.qty -= 1;
      this.cartService.updateCartItem(product.id, product.qty).subscribe({
        next: (res) => console.log('Cart updated:', res),
        error: (err) => console.error('Cart update failed:', err),
      });
    } else {
      product.qty = 0;
      this.cartService.deleteCartItem(product.id).subscribe({
        next: (res) => console.log('Cart item removed:', res),
        error: (err) => console.error('Cart delete failed:', err),
      });
    }
  }

  selectedCategories: string[] = [];

  onCategoryChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const categoryId = checkbox.value;

    if (checkbox.checked) {
      this.selectedCategories.push(categoryId);
    } else {
      this.selectedCategories = this.selectedCategories.filter((id) => id !== categoryId);
    }

    console.log('Selected categories:', this.selectedCategories);
  }
}
