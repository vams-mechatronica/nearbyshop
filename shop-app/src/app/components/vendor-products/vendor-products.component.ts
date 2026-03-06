import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';



import { CartActionsService } from '../../shared/services/cart-actions.service';
import { ProductsService } from '../../services/products.service';
import { CategoryService } from '../../services/category.service';

import { StorageService } from '../../services/storage.service';

import { LoaderService } from '../../services/loader.service';
import { ShopService } from '../../services/shop.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';


@Component({
  standalone: true,
  selector: 'app-vendor-products',
  imports: [CommonModule, FormsModule, RouterLink, RouterModule, ProductCardComponent],
  templateUrl: './vendor-products.component.html',
  styleUrls: ['./vendor-products.component.scss']
})
export class VendorProductsComponent implements OnInit {

  /* ---------------- STATE ---------------- */

  products: any[] = [];
  categories: any[] = [];
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
  noStoresFound = false;
  selectedCategory: string | null = null;
  selectedStoreId: number | null = null;
  showCategories = false;
  storesNext: string | null = null;
  loadingStores = false;


  /* ---------------- VIEW ---------------- */

  @ViewChild('productScroller', { static: true })
  productScroller!: ElementRef;

  @ViewChild('carousel') carousel!: ElementRef;

  /* ---------------- CONSTRUCTOR ---------------- */

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private productService: ProductsService,
    private categoryService: CategoryService,
    private loaderService: LoaderService,
    private shopService: ShopService,
    private storageService: StorageService,
    private cdr: ChangeDetectorRef,
    public cartActions: CartActionsService,
  ) { }

  /* ---------------- INIT ---------------- */

  ngOnInit(): void {
    this.getCategory();
    this.getStoresList();

    // ✅ FIX: react to slug change
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug');

      if (slug && slug !== this.storeSlug) {
        this.storeSlug = slug;

        this.getStoreDetails();
        this.resetAndLoad();
      }
    });
  }

  /* ---------------- STORE ---------------- */

  getStoreDetails(): void {
    if (!this.storeSlug) return;

    this.shopService.getShopDetails(this.storeSlug).subscribe({
      next: (res: any) => { this.storeName = res.shop_name, this.selectedStoreId = res.id },
      error: err => console.error(err)
    });
  }

  getStoresList(loadMore: boolean = false): void {
    if (this.loadingStores) return;
    this.loaderService.show();
    this.loadingStores = true;

    const postalCode = this.storageService.getItem('postal_code');
    let apiCall$;

    // Load more (pagination)
    if (loadMore && this.storesNext) {
      apiCall$ = postalCode
        ? this.categoryService.getStoresByPincode(postalCode, this.storesNext)
        : this.categoryService.getStores(this.storesNext);
    }
    // Initial load
    else {
      apiCall$ = postalCode
        ? this.categoryService.getStoresByPincode(postalCode)
        : this.categoryService.getStores();
    }

    apiCall$.subscribe({
      next: (res: any) => {
        this.stores = loadMore
          ? [...this.stores, ...(res.results || [])]
          : res.results || [];

        this.storesNext = res.next;
        this.noStoresFound = this.stores.length === 0;
        this.loadingStores = false;
        this.loaderService.hide();

        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading stores:', err);
        this.noStoresFound = true;
        this.loadingStores = false;
        this.loaderService.hide();

        this.cdr.markForCheck();
      },
    });
  }


  onStoresScroll(event: Event): void {
    const el = event.target as HTMLElement;

    const nearBottom =
      el.scrollLeft + el.clientWidth >= el.scrollWidth - 120;

    if (nearBottom && this.storesNext && !this.loadingStores) {
      this.getStoresList(true);
    }
  }


  selectStore(store: any): void {
    if (!store?.slug) return;
    this.selectedStoreId = store.id;
    this.router.navigate(['/stores', store.slug]);
  }

  /* ---------------- CATEGORY ---------------- */

  getCategory(): void {
    this.categoryService.getCategories().subscribe({
      next: (res: any) => this.categories = res.results
    });
  }

  onCategoryChange(categorySlug: string): void {
    // Avoid reloading same category
    if (this.categorySlug === categorySlug) {
      return;
    }

    this.categorySlug = categorySlug;
    this.selectedCategory = categorySlug;

    // RESET PAGINATION
    this.products = [];
    this.currentPage = 1;
    this.hasMore = true;

    // LOAD PRODUCTS
    this.resetAndLoadCategory();
  }

  /* ---------------- PAGINATION ---------------- */

  resetAndLoad(): void {
    this.products = [];
    this.currentPage = 1;
    this.hasMore = true;
    this.loadProducts();
  }
  resetAndLoadCategory(): void {
    this.products = [];
    this.currentPage = 1;
    this.hasMore = true;
    this.loadProductsCategory();
  }

  loadProductsCategory(): void {
    if (this.isLoading || !this.hasMore) return;

    this.isLoading = true;
    this.loaderService.show();

    setTimeout(() => {
      const request$ = this.categorySlug
        ? this.productService.getProductsByCategorySlugPagination(
          this.categorySlug,
          this.currentPage,
          this.pageSize
        )
        : this.productService.getProductsPaginated(
          this.currentPage,
          this.pageSize
        );
      request$.subscribe({
        next: (res: any) => {
          const results = res?.results ?? [];

          if (results.length === 0) {
            // 🔴 PERMANENT STOP
            this.hasMore = false;
            return;
          } else if (res?.next === null) {
            this.hasMore = false;
          }

          this.products = [...this.products, ...results];
          this.currentPage++;
        },

        error: () => {
          // stop further calls on error
          this.hasMore = false;
        },

        complete: () => {
          this.isLoading = false;
          this.loaderService.hide();
          this.cdr.detectChanges();
        }
      });

    }, 400);
  }


  loadProducts(): void {
    if (this.isLoading || !this.hasMore) return;

    this.isLoading = true;
    this.loaderService.show();

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
              this.hasMore = false;
              return;
            } else if (res?.next === null) {
              this.hasMore = false;
            }

            this.products.push(...results);
            this.currentPage++;
          },
          error: () => this.hasMore = false,
          complete: () => {
            this.isLoading = false;
            this.loaderService.hide();
            this.cdr.detectChanges();
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
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 150) {
        this.loadProducts();
      }
    }, 200);
  }

  /* ---------------- CART ---------------- */

  addToCart(product: any): void {
    this.cartActions.addToCart(product);
  }



  /* ---------------- SUBSCRIPTION ---------------- */

  openSubscribeModal(product: any): void {
    this.cartActions.openSubscribeModal(product);
  }

  decreaseQty(product: any): void {
    this.cartActions.decreaseQty(product);
  }

  increaseQty(product: any): void {
    this.cartActions.increaseQty(product);
  }


  /* ---------------- CAROUSEL ---------------- */

  scrollLeft(): void {
    this.carousel.nativeElement.scrollBy({ left: -200, behavior: 'smooth' });
  }

  scrollRight(): void {
    this.carousel.nativeElement.scrollBy({ left: 200, behavior: 'smooth' });
  }

  selectCategory(category: any): void {
    this.selectedCategory = category.slug;

    // // If you already have getCategory logic, reuse it
    // if (this.getCategory) {
    //   this.getCategory(this.selectedCategory);
    // }

    // // Reset pagination / products if needed
    // this.products = [];
    // this.page = 1;
    // this.fetchProducts();
  }

  trackById(index: number, item: any): number { return item.id; }
  trackByIndex(index: number): number { return index; }
}
