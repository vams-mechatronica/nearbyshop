import { Component, Injectable, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { ProductsService } from '../../services/products.service';
import { CategoryService } from '../../services/category.service';
import { HttpErrorResponse } from '@angular/common/http';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { hasToken } from '../../shared/utility/utils.common';
import { ToastrService } from 'ngx-toastr';
import { SubscriptionService } from '../../services/subscribe.service';
import { StorageService } from '../../services/storage.service';
import { AuthService } from '../../services/auth.service';
import { HeaderCountService } from '../../services/header.service';
import { LoaderService } from '../../services/loader.service';

@Component({
  standalone: true,
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
  imports: [CommonModule, FormsModule, RouterLink],
})
@Injectable({
  providedIn: 'root'
})
export class ProductsComponent implements OnInit {
  products: any[] = [];
  categoryName: string = 'Darity';
  categories: any[] = [];
  selectedProduct: any;
  subscriptionPlan = 'daily';
  startDate: string = '';

  @ViewChild('subscribeModal') subscribeModal!: TemplateRef<any>;
  private subscribeModalRef!: NgbModalRef;

  constructor(
    private headerService: HeaderCountService,
    private route: ActivatedRoute,
    private modal: NgbModal,
    private cartService: CartService,
    private productService: ProductsService,
    private categoryService: CategoryService,
    private subscribeService: SubscriptionService,
    private storage: StorageService,
    private authService: AuthService,
    private loaderService: LoaderService,
    private toastr: ToastrService,
  ) { }

  ngOnInit(): void {
    const categorySlug = this.route.snapshot.paramMap.get('slug');
    this.loaderService.show();
    this.getCategory();
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
    this.loaderService.hide();
  }
  getCategory() {
    this.categoryService.getCategories().subscribe({
      next: (res: any) => (this.categories = res.results),
      error: (err) => console.error('Error fetching categories:', err),
    });
  }

  addToCart(product: any) {
    // initialize cart structure if not present
    let cart = JSON.parse(this.storage.getItem('cart') || '{"items": [], "total": 0}');

    // check if product already exists
    const existingItem = cart.items.find((item: any) => item.product.id === product.id);

    if (existingItem) {
      existingItem.quantity += 1;
      existingItem.price = (parseFloat(product.price) * existingItem.quantity).toFixed(2);
    } else {
      cart.items.push({
        id: new Date().getTime(), // temporary id for local cart
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          final_price:product.final_price,
          image: product.image,
          discount_type: product.discount_type,
          discount_value: product.discount_value
        },
        quantity: 1,
        price: product.price
      });
    }

    // update total
    cart.total = cart.items.reduce((sum: number, item: any) => sum + parseFloat(item.price), 0);

    // save back to localStorage
    this.storage.setItem('cart', JSON.stringify(cart));

    this.toastr.success(`${product.name} added to cart`, 'Cart Updated');

    product.qty = 1;
    if (this.authService.hasToken()) {
    this.cartService.addToCart(product).subscribe({
      next: (res: any) => console.log('Added to cart:', res),
      error: (err: HttpErrorResponse) => console.error('Add to cart failed:', err),
    }); }

    this.headerService.fetchCounts();
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

    this.subscribeService
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
        error: (err) => {
          this.toastr.error(err.error.message,'Subscription Failed');
        },
      });
    
    this.headerService.fetchCounts();

  }

  increaseQty(product: any): void {
    product.qty = (product.qty || 0) + 1;
    this.cartService.updateCartItem(product.id, product.qty).subscribe({
      next: (res) => this.headerService.fetchCounts(),
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
    this.headerService.fetchCounts();

  }

  onCategoryChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const categorySlug = checkbox.value;

    if (checkbox.checked) {
      this.productService.getProductsByCategorySlug(categorySlug).subscribe({
        next: (res: any) => (this.products = res.results),
        error: (err) => console.error('Error fetching products:', err),
      });

    } else {
      this.productService.getProductsByCategorySlug(this.categoryName.toLowerCase()).subscribe({
        next: (res: any) => (this.products = res.results),
        error: (err) => console.error('Error fetching products:', err),
      });
    }
  }
}
