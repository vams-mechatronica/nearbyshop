import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  TemplateRef,
  ViewChild
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';

import { CartService } from '../../services/cart.service';
import { ProductsService } from '../../services/products.service';
import { CategoryService } from '../../services/category.service';
import { SubscriptionService } from '../../services/subscribe.service';
import { StorageService } from '../../services/storage.service';
import { AuthService } from '../../services/auth.service';
import { HeaderCountService } from '../../services/header.service';
import { LoaderService } from '../../services/loader.service';
import { ShopService } from '../../services/shop.service';

@Component({
  standalone: true,
  selector: 'app-vendor-products',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './vendor-products.component.html',
  styleUrls: ['./vendor-products.component.scss']
})
export class VendorProductsComponent implements OnInit {

  /* ---------------- STATE ---------------- */

  products: any[] = [];
 
  categories: any[] = [];
  selectedProduct: any;
  subscriptionPlan = 'daily';
  startDate: string = '';
  stores: any[] = [];

  storeName = '';
  categoryName = '';
  categorySlug = '';

  currentPage = 1;
  pageSize = 12;

  isLoading = false;
  hasMore = true;

  private storeSlug = '';
  private scrollTimeout: any;

  /* ---------------- VIEW ---------------- */

  @ViewChild('productScroller', { static: true })
  productScroller!: ElementRef;

  @ViewChild('subscribeModal')
  subscribeModal!: TemplateRef<any>;

  private subscribeModalRef!: NgbModalRef;

  /* ---------------- CONSTRUCTOR ---------------- */

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private modal: NgbModal,
    private productService: ProductsService,
    private categoryService: CategoryService,
    private cartService: CartService,
    private subscribeService: SubscriptionService,
    private storage: StorageService,
    private authService: AuthService,
    private headerService: HeaderCountService,
    private loaderService: LoaderService,
    private shopService: ShopService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  /* ---------------- INIT ---------------- */

  ngOnInit(): void {
    this.storeSlug = this.route.snapshot.paramMap.get('slug') || '';

    this.getCategory();
    this.getStoresList();
    this.getStoreDetails();

    this.resetAndLoad();
  }

  /* ---------------- STORE ---------------- */

  getStoreDetails(): void {
    if (!this.storeSlug) return;

    this.shopService.getShopDetails(this.storeSlug).subscribe({
      next: (res: any) => this.storeName = res.shop_name,
      error: err => console.error(err)
    });
  }

  /* ---------------- CATEGORY ---------------- */

  getCategory(): void {
    this.categoryService.getCategories().subscribe({
      next: (res: any) => this.categories = res.results
    });
  }

  getStoresList(): void {
    this.categoryService.getStores().subscribe({
      next: (res: any) => this.stores = res.results
    });
  }

  onCategoryChange(event: Event): void {
    const checkbox = event.target as HTMLInputElement;

    this.categorySlug = checkbox.checked ? checkbox.value : '';
    this.categoryName = this.categorySlug;

    this.resetAndLoad();
  }

  /* ---------------- PAGINATION CORE ---------------- */

  resetAndLoad(): void {
    this.products = [];
    this.currentPage = 1;
    this.hasMore = true;

    this.loadProducts();
  }

  loadProducts(): void {
    if (this.isLoading || !this.hasMore) return;

    this.isLoading = true;
    this.loaderService.show();

    // 🔹 human-like delay
    setTimeout(() => {
      this.productService
        .getProductsByStoreSlugPagination(
          this.storeSlug,
          this.currentPage,
          this.pageSize
        )
        .subscribe({
          next: (res: any) => {
            const results = res?.results ?? [];

            if (results.length === 0) {
              this.hasMore = false; // 🔴 stop permanently
              return;
            }

            this.products.push(...results);
            this.currentPage++;
          },
          error: () => {
            this.hasMore = false;
          },
          complete: () => {
            this.isLoading = false;
            this.loaderService.hide();
            this.cdr.detectChanges(); // prevent NG0100
          }
        });
    }, 400);
  }

  /* ---------------- SCROLL ---------------- */

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

  /* ---------------- CART ---------------- */

  addToCart(product: any): void {
    let cart = JSON.parse(
      this.storage.getItem('cart') || '{"items": [], "total": 0}'
    );

    const existing = cart.items.find(
      (item: any) => item.product.id === product.id
    );

    if (existing) {
      existing.quantity += 1;
      existing.price = (
        parseFloat(product.price) * existing.quantity
      ).toFixed(2);
    } else {
      cart.items.push({
        id: Date.now(),
        product,
        quantity: 1,
        price: product.price
      });
    }

    cart.total = cart.items.reduce(
      (sum: number, item: any) => sum + parseFloat(item.price),
      0
    );

    this.storage.setItem('cart', JSON.stringify(cart));
    this.toastr.success(`${product.name} added to cart`);
    this.headerService.fetchCounts();
  }

  /* ---------------- SUBSCRIPTION ---------------- */

  openSubscribeModal(product: any): void {
    this.subscribeModalRef = this.modal.open(this.subscribeModal, {
      centered: true,
      backdrop: 'static'
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

  // onCategoryChange(event: Event): void {
  //   const checkbox = event.target as HTMLInputElement;
  //   const categorySlug = checkbox.value;

  //   if (checkbox.checked) {
  //     this.productService.getProductsByCategorySlug(categorySlug).subscribe({
  //       next: (res: any) => (this.products = res.results),
  //       error: (err) => console.error('Error fetching products:', err),
  //     });

  //   } else {
  //     this.productService.getProductsByCategorySlug(this.categoryName.toLowerCase()).subscribe({
  //       next: (res: any) => (this.products = res.results),
  //       error: (err) => console.error('Error fetching products:', err),
  //     });
  //   }
  // }
  @ViewChild('carousel') carousel!: ElementRef;
  scrollLeft() {
    this.carousel.nativeElement.scrollBy({ left: -200, behavior: 'smooth' });
  }
  scrollRight() {
    this.carousel.nativeElement.scrollBy({ left: 200, behavior: 'smooth' });
  }
  
  selectStore(store: any) {
    this.router.navigate(['/stores', store.slug]);
  }
}
