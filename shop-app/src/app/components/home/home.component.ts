import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Injectable,
  AfterViewInit,
  OnDestroy,
  PLATFORM_ID,
  Inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  TemplateRef,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { CategoryService } from '../../services/category.service';
import { BannerService } from '../../services/banner.service';
import { StorageService } from '../../services/storage.service';
import { ProductsService } from '../../services/products.service';
import { HttpErrorResponse } from '@angular/common/http';
import { CartService } from '../../services/cart.service';
import { SubscriptionService } from '../../services/subscribe.service';
import { AuthService } from '../../services/auth.service';
import { LoaderService } from '../../services/loader.service';
import { ToastrService } from 'ngx-toastr';
import { HeaderCountService } from '../../services/header.service';
import { AuthModalService } from '../../services/auth-modal.service';
import { AnalyticsService } from '../../services/analytics.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';

interface CategoryShelf {
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  products: any[];
  next: string | null;
  loading: boolean;
}


@Component({
  standalone: true,
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [CommonModule, RouterLink, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
@Injectable({ providedIn: 'root' })
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  /** Carousel References */
  @ViewChild('heroCarousel') heroCarousel!: ElementRef;
  @ViewChild('categoryCarousel') categoryCarousel!: ElementRef;
  @ViewChild('storeCarousel') storeCarousel!: ElementRef;
  @ViewChild('bannerContainer', { static: true }) bannerContainer!: ElementRef;

  /** Data Models */
  categories: any[] = [];
  stores: any[] = [];
  banners: any[] = [];
  processedBanners: any[] = [];
  categoryShelves: CategoryShelf[] = [];

  /** Recent Visit & Banner State */
  recentVisits = ['Groceries', 'Rice', 'Wheat'];
  currentBannerIndex = 0;
  noStoresFound = false;
  postalCode: string | null = null;
  loadingCategories = false;
  storesNext: string | null = null;
  loadingStores = false;
  selectedProduct: any;
  subscriptionPlan = 'daily';
  startDate: string = '';


  /** Utilities */
  private interval!: ReturnType<typeof setInterval>;
  private observer!: IntersectionObserver;
  // productService: any;

  @ViewChild('subscribeModal') subscribeModal!: TemplateRef<any>;
  private subscribeModalRef!: NgbModalRef;

  constructor(
    private router: Router,
    private categoryService: CategoryService,
    private bannerService: BannerService,
    private storageService: StorageService,
    private productService: ProductsService,
    private cdr: ChangeDetectorRef,
    private cartService: CartService,
    private subscribeService: SubscriptionService,
    private storage: StorageService,
    private authService: AuthService,
    private loaderService: LoaderService,
    private toastr: ToastrService,
    private headerService: HeaderCountService,
    private authModal: AuthModalService,
    private analytics: AnalyticsService,
    private modal: NgbModal,
    
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    const newPostalCode = this.storageService.getItem('postal_code');
    this.loadCategories();
    if (this.postalCode !== newPostalCode) {
      this.postalCode = newPostalCode;
      this.fetchStores(false);
    } else {
      this.fetchStores(false);
    }
    this.fetchBanners();
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.analytics.trackPageView(event.urlAfterRedirects);
      }
    });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Optional: Lazy-load banners when visible
    if (this.bannerContainer?.nativeElement) {
      this.observer = new IntersectionObserver(
        async (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              if (!this.processedBanners.length) await this.fetchBanners();
              this.observer.disconnect();
            }
          }
        },
        { threshold: 0.1 }
      );
      this.observer.observe(this.bannerContainer.nativeElement);
    }
  }

  ngOnDestroy(): void {
    if (this.interval) clearInterval(this.interval);
    if (this.observer) this.observer.disconnect();

    this.categoryShelves = [];
    this.categories = [];
  }

  fetchCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (res: any) => { this.categories = res.results || [], this.cdr.markForCheck(); },
      error: (err) => console.error('Error loading categories:', err),
    });
  }

  fetchStores(loadMore = false): void {
    if (this.loadingStores) return;

    // ✅ RESET state on first load
    if (!loadMore) {
      this.stores = [];
      this.storesNext = null;
      this.noStoresFound = false;
    }

    this.loadingStores = true;

    const postalCode = this.storageService.getItem('postal_code');

    let apiCall$;

    if (loadMore && this.storesNext) {
      apiCall$ = postalCode
        ? this.categoryService.getStoresByPincode(postalCode, this.storesNext)
        : this.categoryService.getStores(this.storesNext);
    } else {
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
        this.cdr.markForCheck();
      },
      error: () => {
        this.noStoresFound = true;
        this.loadingStores = false;
        this.cdr.markForCheck();
      }
    });
  }

  onStoreScroll(event: Event): void {
    const el = event.target as HTMLElement;

    const nearEnd =
      el.scrollLeft + el.clientWidth >= el.scrollWidth - 120;

    if (nearEnd && this.storesNext && !this.loadingStores) {
      this.fetchStores(true);
    }
  }


  fetchBanners(): Promise<void> {
    return new Promise((resolve) => {
      // Check cache first
      const cached = this.storageService.getItem('cachedBanners');
      if (cached) {
        this.processedBanners = JSON.parse(cached);
        this.startBannerAutoScroll();
        resolve();
        return;
      }

      this.bannerService.getBanners().subscribe({
        next: async (res: any) => {
          const banners = res?.results || [];
          if (!banners.length) {
            resolve();
            return;
          }

          // Preload images concurrently
          const loadedBanners = await this.preloadBanners(banners);

          // Prepare loop for carousel
          this.processedBanners = this.prepareLoopBanners(loadedBanners);

          // Cache for next visit
          this.storageService.setItem(
            'cachedBanners',
            JSON.stringify(this.processedBanners)
          );

          // Start auto-scroll
          if (this.processedBanners.length > 1) this.startBannerAutoScroll();

          resolve();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error loading banners:', err);
          resolve();
        },
      });
    });
  }

  // ────────────────────────────────
  // 🧠 HELPERS
  // ────────────────────────────────
  /** Preload images concurrently (like threads) */
  preloadBanners(banners: any[]): Promise<any[]> {
    const promises = banners.map(
      (b) =>
        new Promise((resolve) => {
          if (isPlatformBrowser(this.platformId)) {
            const img = new Image();
            img.src = b.image + '?f_auto,q_auto,w_1600,h_600,c_fill';
            img.onload = () => resolve({ ...b, cachedSrc: img.src });
            img.onerror = () => resolve({ ...b, cachedSrc: b.image }); // fallback
          }
        })
    );
    return Promise.all(promises);
  }

  prepareLoopBanners(banners: any[]): any[] {
    const len = banners.length;
    if (len === 1) return [banners[0], banners[0], banners[0]];
    if (len === 2) return [...banners, banners[0]];
    return [...banners, ...banners.slice(0, 3)];
  }

  startBannerAutoScroll(): void {
    if (this.interval) clearInterval(this.interval);

    this.interval = setInterval(() => {
      this.currentBannerIndex++;
      if (this.currentBannerIndex >= this.processedBanners.length - 3) {
        setTimeout(() => (this.currentBannerIndex = 0), 700);
      }
    }, 3000);
  }

  // ────────────────────────────────
  // 🎯 CAROUSEL CONTROLS
  // ────────────────────────────────
  scrollLeft(carousel: HTMLElement): void {
    carousel.scrollBy({ left: -300, behavior: 'smooth' });
  }

  // scrollRight(carousel: HTMLElement): void {
  //   carousel.scrollBy({ left: 300, behavior: 'smooth' });
  // }

  // ────────────────────────────────
  // 🧭 NAVIGATION
  // ────────────────────────────────
  selectCategory(cat: any): void {
    this.analytics.trackEvent('CATEGORY_PAGE_REDIRECT_CLICKED', 'PAGE_VISIT', 1, `CATEGORY: ${cat.slug}`);
    if (cat?.slug) this.router.navigate(['/products', cat.slug]);
  }

  selectStore(store: any): void {
    this.analytics.trackEvent('STORE_PAGE_REDIRECT_CLICKED', 'PAGE_VISIT', 1, `STORE: ${store.slug}`);
    if (store?.slug) this.router.navigate(['/stores', store.slug]);
  }

  /* STEP 1: LOAD CATEGORIES */
  loadCategories(): void {
    this.loadingCategories = true;

    // assume you already have this API
    this.categoryService.getCategories().subscribe(res => {
      this.categories = res?.results || [];
      this.initCategoryShelves();
      this.loadingCategories = false;
    });
  }

  /* STEP 2: INIT FIRST FEW SHELVES */
  initCategoryShelves(): void {
    this.categoryShelves = [];
    const firstCategories = this.categories.slice(0, 10); // first 4 shelves

    firstCategories.forEach(cat => {
      this.categoryShelves.push({
        categoryId: cat.id,
        categoryName: cat.name,
        categorySlug: cat.slug,
        products: [],
        next: null,
        loading: false
      });

      this.loadProductsForCategory(cat.slug);
    });
    this.cdr.markForCheck();
  }

  /* STEP 3: LOAD PRODUCTS (PAGINATED) */
  loadProductsForCategory(categorySlug: string): void {
    const shelf = this.categoryShelves.find(c => c.categorySlug === categorySlug);
    if (!shelf || shelf.loading) return;

    shelf.loading = true;
    let page = 1;

    if (shelf.next) {
      page = Number(
        shelf.next
          .split('?')[1]          // page=3&page_size=10
          .split('&')             // ["page=3", "page_size=10"]
          .find(p => p.startsWith('page=')) // "page=3"
          ?.split('=')[1]         // "3"
      );
    }

    this.productService.getProductsByCategorySlugPagination(categorySlug, page).subscribe(res => {
      shelf.products.push(...res.results);
      shelf.next = res?.next;
      shelf.loading = false;
      this.cdr.markForCheck();
    });
  }

  /* STEP 4: HORIZONTAL SCROLL HANDLER */
  onHorizontalScroll(event: Event, categorySlug: string): void {
    const el = event.target as HTMLElement;

    const nearEnd =
      el.scrollLeft + el.clientWidth >= el.scrollWidth - 100;

    const shelf = this.categoryShelves.find(c => c.categorySlug === categorySlug);

    if (nearEnd && shelf?.next) {
      this.loadProductsForCategory(categorySlug);
    }
  }
  scrollRight(carousel: HTMLElement, categorySlug: string) {

    carousel.scrollBy({
      left: 300,
      behavior: 'smooth'
    });

    const nearEnd =
      carousel.scrollLeft + carousel.clientWidth >=
      carousel.scrollWidth - 150;

    const shelf = this.categoryShelves.find(c => c.categorySlug === categorySlug);

    if (nearEnd && shelf?.next) {
      this.loadProductsForCategory(categorySlug);
    }
  }


  /* STEP 5: LOAD MORE CATEGORIES ON PAGE SCROLL */
  loadNextCategoryShelf(): void {
    const loadedCount = this.categoryShelves.length;
    const nextCategory = this.categories[loadedCount];

    if (!nextCategory) return;

    this.categoryShelves.push({
      categoryId: nextCategory.id,
      categoryName: nextCategory.name,
      categorySlug: nextCategory.slug,
      products: [],
      next: null,
      loading: false
    });

    this.loadProductsForCategory(nextCategory.id);
  }

  addToCart(product: any): void {
    this.analytics.trackEvent('ADD_TO_CART_CLICKED', 'ECOMMERCE', 1, `PRODUCT_ID: ${product.id}`);


    // 🔐 Force login
    if (!this.authService.isLoggedIn()) {
      localStorage.setItem('redirect_url', '/cart');
      this.authModal.openLogin();
      return;
    }

    product.qty += 1;

    const body = {
      product_id: product.id,
      quantity: 1
    };

    this.cartService.addToCart(body).subscribe({
      next: (res) => {
        if (!res.success) return;

        if (res.action === 'removed') {
          product.qty = 0;
        } else if (res.item) {
          product.qty = res.item.quantity;
        }

        this.headerService.updateCartSummary(res.cart);
      },
      error: () => {
        product.qty -= 1;
      }
    });
  }

  openSubscribeModal(product: any): void {

    // 🔐 Force login before subscription
    if (!this.authService.isLoggedIn()) {
      // save intent (optional but recommended)
      localStorage.setItem('redirect_url', '/subscribe');

      // open login modal
      this.authModal.openLogin();
      return;
    }

    // ✅ user is logged in → open subscribe modal
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
          this.subscribeModalRef?.close();
        },
        error: (err) => {
          this.toastr.error(err.error.message, 'Subscription Failed');
        },
      });

    this.headerService.fetchCounts();

  }

  decreaseQty(product: any): void {
    const currentQty = product.qty || 1;
    if (currentQty <= 1) {
      product.qty = 0;
      this.cartService.deleteCartItem(product.id).subscribe({
        next: () => {
          this.headerService.fetchCounts();
        },
        error: () => {
          product.qty += 1;
        }
      });
      return;
    }
    const newQty = currentQty - 1;
    product.qty -= 1;
    this.cartService.updateCartItem(product.id, newQty).subscribe({
      next: (res) => {
        if (!res.success) return;
        if (res.item) {
          product.qty = res.item.quantity;
        }
        this.headerService.updateCartSummary(res.cart);
      },
      error: (err) => {
        product.qty += 1;
      }
    });
  }

  increaseQty(product: any): void {

    const newQty = (product.qty || 0) + 1;
    product.qty += 1;

    this.cartService.updateCartItem(product.id, newQty).subscribe({
      next: (res) => {
        if (!res.success) return;
        if (res.item) {
          product.qty = res.item.quantity;
        }
        this.headerService.updateCartSummary(res.cart);
      },
      error: () => {
        product.qty -= 1;
      }
    });
  }

}
