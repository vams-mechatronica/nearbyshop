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
import { HostListener } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';

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
  categorySlug: string = '';
  categories: any[] = [];
  selectedProduct: any;
  subscriptionPlan = 'daily';
  startDate: string = '';

  currentPage = 1;
  pageSize = 12;
  hasMore = true;
  isLoading = false;
  showCategories = false;


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
    private storageService: StorageService,
    private cdr: ChangeDetectorRef,
  ) { }

  @ViewChild('productScroller', { static: true })
  productScroller!: any;

  private scrollTimeout: any;

  onProductScroll(): void {
    if (this.isLoading || !this.hasMore) return;

    clearTimeout(this.scrollTimeout);

    this.scrollTimeout = setTimeout(() => {
      const el = this.productScroller.nativeElement;

      const reachedBottom =
        el.scrollTop + el.clientHeight >= el.scrollHeight - 150;

      if (reachedBottom) {
        this.loadProducts();
      }
    }, 200);
  }


  ngOnInit(): void {
    setTimeout(() => {
      this.loaderService.show();
    });
    this.getCategory();

    this.route.paramMap.subscribe(params => {
      this.categorySlug = params.get('slug') || '';

      if (this.categorySlug) {
        this.categoryName = this.categorySlug;
      }

      // RESET STATE
      this.products = [];
      this.currentPage = 1;
      this.hasMore = true;

      this.loadProducts();
    });
  }

  getCategory() {
    this.categoryService.getCategories().subscribe({
      next: (res: any) => (this.categories = res.results),
      error: (err) => console.error('Error fetching categories:', err),
    });
  }

  loadProducts(reset = false): void {
  if (reset) {
    this.currentPage = 1;
    this.products = [];
    this.hasMore = true;
  }

  if (this.isLoading || !this.hasMore) return;

  this.isLoading = true;
  this.loaderService.show();

  const pincode = this.storageService.getItem('postal_code');
  // console.log(pincode);

  let request$;

  if (this.categorySlug && pincode) {
    request$ = this.productService.getProductsByCategorySlugPaginationPincode(
      this.categorySlug,
      pincode,
      this.currentPage,
      this.pageSize
    );
  } 
  else if (this.categorySlug) {
    request$ = this.productService.getProductsByCategorySlugPagination(
      this.categorySlug,
      this.currentPage,
      this.pageSize
    );
  }
  // else if (pincode) {
  //   request$ = this.productService.getProductsByPincode(
  //     pincode,
  //     this.currentPage,
  //     this.pageSize
  //   );
  // }
  else {
    request$ = this.productService.getProductsPaginated(
      this.currentPage,
      this.pageSize
    );
  }

  request$.subscribe({
    next: (res: any) => {
      const results = res?.results ?? [];

      this.products = [...this.products, ...results];
      this.hasMore = !!res?.next;
      this.currentPage++;
    },

    error: () => {
      this.hasMore = false;
    },

    complete: () => {
      this.isLoading = false;
      this.loaderService.hide();
    }
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
          final_price: product.final_price,
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
      });
    }

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
          this.toastr.error(err.error.message, 'Subscription Failed');
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

  onCategoryChange(categorySlug: string): void {
    // Avoid reloading same category
    if (this.categorySlug === categorySlug) {
      return;
    }

    this.categorySlug = categorySlug;
    this.categoryName = categorySlug;

    // RESET PAGINATION
    this.products = [];
    this.currentPage = 1;
    this.hasMore = true;

    // LOAD PRODUCTS
    this.loadProducts();
  }


}
