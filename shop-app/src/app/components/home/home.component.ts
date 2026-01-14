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
  imports: [CommonModule, RouterLink],
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

  /** Utilities */
  private interval!: ReturnType<typeof setInterval>;
  private observer!: IntersectionObserver;
  // productService: any;

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
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  // ────────────────────────────────
  // 🧩 INIT
  // ────────────────────────────────
  ngOnInit(): void {
    this.postalCode = this.storageService.getItem('postal_code');
    this.fetchCategories();
    this.fetchStores();
    this.fetchBanners(); // initial load
    this.loadCategories();
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
  }

  // ────────────────────────────────
  // 🛒 FETCH DATA
  // ────────────────────────────────
  fetchCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (res: any) => { this.categories = res.results || [], this.cdr.markForCheck(); },
      error: (err) => console.error('Error loading categories:', err),
    });
  }

  // fetchStores(): void {
  //   this.categoryService.getStores().subscribe({
  //     next: (res: any) => (this.stores = res.results || [], this.cdr.markForCheck()),
  //     error: (err) => console.error('Error loading stores:', err),
  //   });
  // }

  fetchStores(): void {
    const postalCode = this.storageService.getItem('postal_code');
    let apiCall$;

    if (postalCode) {
      // console.log(`🔍 Fetching stores for pincode: ${postalCode}`);
      apiCall$ = this.categoryService.getStoresByPincode(postalCode);
    } else {
      apiCall$ = this.categoryService.getStores();
    }

    apiCall$.subscribe({
      next: (res: any) => {
        this.stores = res.results || [];
        this.noStoresFound = this.stores.length === 0;
        this.cdr.markForCheck();
      },
      error: (err) => { console.error('Error loading stores:', err); this.noStoresFound = true; this.cdr.markForCheck(); },
    });
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
    this.analytics.trackEvent('CATEGORY_PAGE_REDIRECT_CLICKED','PAGE_VISIT',1,`CATEGORY: ${cat.slug}`);
    if (cat?.slug) this.router.navigate(['/products', cat.slug]);
  }

  selectStore(store: any): void {
    this.analytics.trackEvent('STORE_PAGE_REDIRECT_CLICKED','PAGE_VISIT',1,`STORE: ${store.slug}`);
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
    const firstCategories = this.categories.slice(0, 4); // first 4 shelves

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
    this.analytics.trackEvent('ADD_TO_CART_CLICKED','ECOMMERCE',1,`PRODUCT_ID: ${product.id}`);


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
}
