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
  HostListener,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { CategoryService } from '../../services/category.service';
import { BannerService } from '../../services/banner.service';
import { StorageService } from '../../services/storage.service';
import { ProductsService } from '../../services/products.service';
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
import { debounceTime, distinctUntilChanged, Subject, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { API_ENDPOINTS } from '../../shared/constants/api.constants';

interface CategoryShelf {
  categoryId: number;
  categoryName: string;
  categorySlug: string;
  products: any[];
  next: string | null;
  loading: boolean;
}

// Fix: Use literal union types for type property
type SuggestionType = 'product' | 'shop' | 'category';

interface SearchSuggestion {
  id: number;
  name: string;
  type: SuggestionType; // Fixed type definition
  shop_name?: string;
  price?: number;
  image?: string;
  rating?: number;
  delivery_time?: number;
}

interface RecentSearch {
  query: string;
  timestamp: number;
  count: number;
}

interface SearchResult {
  id: number;
  name: string;
  description: string;
  price: number;
  original_price?: number;
  image: string;
  rating: number;
  shop_name: string;
  delivery_time: number;
  discount?: number;
  type: 'product' | 'shop';
  shop_id?: number;
  category_name?: string;
  unit?: any;
}

interface FilterOption {
  id: string;
  name: string;
  icon: string;
}

interface ShopResult {
  id: number;
  name: string;
  description: string;
  image: string;
  rating: number;
  delivery_time: number;
  distance: number;
  category: string;
  tags: string[];
  is_open: boolean;
  min_order_amount: number;
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
  // Search Properties
  searchQuery: string = '';
  showSuggestions: boolean = false;
  searchSuggestions: SearchSuggestion[] = [];
  recentSearches: RecentSearch[] = [];
  quickSuggestions: string[] = ['Milk', 'Bread', 'Eggs', 'Vegetables', 'Fruits', 'Snacks'];

  // Search Results
  showSearchResults: boolean = false;
  searchResults: SearchResult[] = [];
  shopResults: ShopResult[] = [];
  loading: boolean = false;
  totalResults: number = 0;
  totalPages: number = 1;
  currentPage: number = 1;
  pageSize: number = 20;

  // Filters
  showFilters: boolean = false;
  activeFilter: string = '';
  sortBy: string = 'relevance';
  priceRange: [number, number] = [0, 5000];
  selectedDeliveryTime: string = '';
  activeFilters: string[] = [];
  selectedCategories: number[] = [];

  // Data
  quickFilters: FilterOption[] = [
    { id: 'all', name: 'All', icon: 'fas fa-th' },
    { id: 'groceries', name: 'Groceries', icon: 'fas fa-shopping-basket' },
    { id: 'food', name: 'Food', icon: 'fas fa-utensils' },
    { id: 'medicine', name: 'Medicine', icon: 'fas fa-pills' },
    { id: 'home', name: 'Home', icon: 'fas fa-home' }
  ];

  popularCategories = [
    { id: 1, name: 'Dairy & Eggs', image: 'assets/images/dairy.jpg', product_count: 45 },
    { id: 2, name: 'Fruits & Vegetables', image: 'assets/images/fruits.jpg', product_count: 78 },
    { id: 3, name: 'Snacks & Beverages', image: 'assets/images/snacks.jpg', product_count: 62 },
    { id: 4, name: 'Home Essentials', image: 'assets/images/home.jpg', product_count: 34 }
  ];

  allCategories = [
    { id: 1, name: 'Groceries', count: 156, selected: false },
    { id: 2, name: 'Dairy & Eggs', count: 45, selected: false },
    { id: 3, name: 'Fruits & Vegetables', count: 78, selected: false },
    { id: 4, name: 'Snacks & Beverages', count: 62, selected: false },
    { id: 5, name: 'Home Essentials', count: 34, selected: false },
    { id: 6, name: 'Personal Care', count: 28, selected: false }
  ];

  deliveryTimes = [
    { label: 'Within 15 mins', value: '15' },
    { label: 'Within 30 mins', value: '30' },
    { label: 'Within 45 mins', value: '45' },
    { label: 'Any time', value: 'any' }
  ];

  suggestionCategories = [
    { id: 1, name: 'Groceries' },
    { id: 2, name: 'Dairy Products' },
    { id: 3, name: 'Fresh Vegetables' },
    { id: 4, name: 'Bakery Items' }
  ];

  // Search subject for debouncing
  private searchSubject = new Subject<string>();

  /** Carousel References */
  @ViewChild('heroCarousel') heroCarousel!: ElementRef;
  @ViewChild('categoryCarousel') categoryCarousel!: ElementRef;
  @ViewChild('storeCarousel') storeCarousel!: ElementRef;
  @ViewChild('bannerContainer', { static: true }) bannerContainer!: ElementRef;
  @ViewChild('searchInput') searchInput!: ElementRef;

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
  copied: boolean = false;


  // For search results overlay
  @ViewChild('searchResultsOverlay') searchResultsOverlay!: TemplateRef<any>;
  private searchModalRef!: NgbModalRef;

  /** Utilities */
  private interval!: ReturnType<typeof setInterval>;
  private observer!: IntersectionObserver;

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
    private http: HttpClient,

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





    // Load recent searches from localStorage
    this.loadRecentSearches();

    // Setup search debouncing
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      if (query.trim().length > 0) {
        this.fetchSearchSuggestions(query);
      } else {
        this.searchSuggestions = [];
      }
    });

    // Load quick suggestions
    this.fetchQuickSuggestions();
  }

  // ========== SEARCH FUNCTIONALITY ==========

  onSearchInput(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.searchQuery = query;
    this.searchSubject.next(query);

    if (query.trim().length >= 2) {
      this.showSuggestions = true;
    } else {
      this.showSuggestions = false;
      this.searchSuggestions = [];
    }
  }
  copyCode(text: string) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.showCopiedFeedback();
      }).catch(() => {
        this.fallbackCopy(text);
      });
    } else {
      this.fallbackCopy(text);
    }
  }

  fallbackCopy(text: string) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);

    this.showCopiedFeedback();
  }

  showCopiedFeedback() {
    this.copied = true;
    setTimeout(() => {
      this.copied = false;
    }, 2000);
  }

  onSearchBlur(event: FocusEvent): void {
    // Delay hiding suggestions to allow click on suggestions
    setTimeout(() => {
      this.showSuggestions = false;
    }, 200);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchSuggestions = [];
    this.showSuggestions = false;
    if (this.searchInput) {
      this.searchInput.nativeElement.focus();
    }
  }

  fetchSearchSuggestions(query: string): void {
    if (query.length < 2) {
      this.searchSuggestions = [];
      return;
    }

    // Try to get suggestions from API
    this.http.get<any[]>(API_ENDPOINTS.SEARCH_SUGGESTIONS, {
      params: { q: query, limit: '8' }
    }).pipe(
      catchError(() => {
        // Fallback to local search
        return this.generateFallbackSuggestions(query);
      })
    ).subscribe({
      next: (response) => {
        this.searchSuggestions = response.map(item => ({
          id: item.id,
          name: item.name,
          type: (item.type || 'product') as SuggestionType, // Cast to SuggestionType
          shop_name: item.shop_name,
          price: item.price,
          image: item.image,
          rating: item.rating,
          delivery_time: item.delivery_time
        }));
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error fetching suggestions:', error);
        this.searchSuggestions = [];
        this.cdr.markForCheck();
      }
    });
  }

  private generateFallbackSuggestions(query: string): Observable<SearchSuggestion[]> {
    // Generate mock suggestions with proper type casting
    const mockSuggestions: SearchSuggestion[] = [
      {
        id: 1,
        name: `${query} - Product`,
        type: 'product' as SuggestionType,
        shop_name: 'Local Store',
        price: 99,
        rating: 4.5,
        delivery_time: 15
      },
      {
        id: 2,
        name: `${query} - Shop`,
        type: 'shop' as SuggestionType,
        shop_name: 'Local Shop',
        rating: 4.2,
        delivery_time: 20
      },
      {
        id: 3,
        name: `${query} - Category`,
        type: 'category' as SuggestionType
      },
      {
        id: 4,
        name: `${query} Premium`,
        type: 'product' as SuggestionType,
        shop_name: 'Premium Store',
        price: 149,
        rating: 4.7,
        delivery_time: 10
      },
    ].slice(0, 5);

    return of(mockSuggestions);
  }

  fetchQuickSuggestions(): void {
    this.http.get<string[]>(API_ENDPOINTS.QUICK_SUGGESTIONS).pipe(
      catchError(() => of(this.quickSuggestions))
    ).subscribe({
      next: (response) => {
        this.quickSuggestions = response;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error fetching quick suggestions:', error);
        this.cdr.markForCheck();
      }
    });
  }

  loadRecentSearches(): void {
    const recent = this.storageService.getItem('recentSearches');
    this.recentSearches = recent ? JSON.parse(recent) : [];
  }

  saveRecentSearch(query: string, count: number): void {
    const existingIndex = this.recentSearches.findIndex(s => s.query === query);

    if (existingIndex >= 0) {
      this.recentSearches[existingIndex].timestamp = Date.now();
      this.recentSearches[existingIndex].count = count;
    } else {
      this.recentSearches.unshift({
        query,
        timestamp: Date.now(),
        count
      });

      // Keep only last 5 searches
      if (this.recentSearches.length > 5) {
        this.recentSearches.pop();
      }
    }

    this.storageService.setItem('recentSearches', JSON.stringify(this.recentSearches));
  }

  clearRecentSearches(): void {
    this.recentSearches = [];
    this.storageService.removeItem('recentSearches');
    this.cdr.markForCheck();
  }

  selectRecentSearch(search: RecentSearch): void {
    this.searchQuery = search.query;
    this.performSearch();
    this.showSuggestions = false;
  }

  selectCategoryFromList(cat: any): void {
    this.searchQuery = cat.name;
    this.performSearch();
    this.showSuggestions = false;
  }

  selectQuickSuggestion(suggestion: string): void {
    this.searchQuery = suggestion;
    this.performSearch();
    this.showSuggestions = false;
  }

  selectSuggestion(suggestion: SearchSuggestion): void {
    this.searchQuery = suggestion.name;
    this.showSuggestions = false;

    if (suggestion.type === 'product') {
      this.router.navigate(['/product', suggestion.id]);
    } else if (suggestion.type === 'shop') {
      this.router.navigate(['/shop', suggestion.id]);
    } else {
      this.performSearch();
    }
  }

  getSuggestionIcon(type: SuggestionType): string {
    switch (type) {
      case 'product': return 'fas fa-shopping-bag';
      case 'shop': return 'fas fa-store';
      case 'category': return 'fas fa-tag';
      default: return 'fas fa-search';
    }
  }

  performSearch(): void {
    const query = this.searchQuery.trim();

    if (!query) {
      return;
    }

    // Save to recent searches
    this.saveRecentSearch(query, 0);

    // Show search results overlay
    this.openSearchResultsOverlay();

    // Perform search
    this.searchResults = [];
    this.shopResults = [];
    this.loading = true;
    this.currentPage = 1;
    this.cdr.markForCheck();

    const params: any = {
      q: query,
      page: this.currentPage.toString(),
      page_size: this.pageSize.toString(),
      sort_by: this.sortBy,
      price_min: this.priceRange[0].toString(),
      price_max: this.priceRange[1].toString(),
      delivery_time: this.selectedDeliveryTime
    };

    if (this.selectedCategories.length > 0) {
      params.categories = this.selectedCategories.join(',');
    }

    if (this.activeFilter && this.activeFilter !== 'all') {
      params.category = this.activeFilter;
    }

    this.http.get<any>('/api/search/', { params }).pipe(
      catchError(() => this.generateFallbackResults(query))
    ).subscribe({
      next: (response) => {
        this.searchResults = response.products || [];
        this.shopResults = response.shops || [];
        this.totalResults = response.total_results || 0;
        this.totalPages = response.total_pages || 1;
        this.loading = false;

        // Update recent search count
        this.updateRecentSearchCount(query, this.totalResults);
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Search error:', error);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private generateFallbackResults(query: string): Observable<any> {
    // Generate mock results for demo
    const mockProducts: SearchResult[] = [
      {
        id: 1,
        name: `Fresh ${query}`,
        description: `High quality ${query} from local vendors`,
        price: 45,
        original_price: 50,
        image: 'assets/images/product-placeholder.jpg',
        rating: 4.5,
        shop_name: 'Local Store',
        delivery_time: 7,
        discount: 10,
        type: 'product'
      },
      {
        id: 2,
        name: `Organic ${query}`,
        description: `100% organic ${query}`,
        price: 65,
        image: 'assets/images/product-placeholder.jpg',
        rating: 4.2,
        shop_name: 'Organic Shop',
        delivery_time: 10,
        type: 'product'
      }
    ];

    const mockShops: ShopResult[] = [
      {
        id: 1,
        name: `${query} Specialists`,
        description: `Specialized in ${query} products`,
        image: 'assets/images/shop-placeholder.jpg',
        rating: 4.7,
        delivery_time: 15,
        distance: 1.5,
        category: 'Groceries',
        tags: ['Fresh', 'Organic', 'Local'],
        is_open: true,
        min_order_amount: 100
      }
    ];

    return of({
      products: mockProducts,
      shops: mockShops,
      total_results: mockProducts.length + mockShops.length,
      total_pages: 1,
      current_page: 1
    });
  }

  updateRecentSearchCount(query: string, count: number): void {
    const index = this.recentSearches.findIndex(s => s.query === query);
    if (index >= 0) {
      this.recentSearches[index].count = count;
      this.storageService.setItem('recentSearches', JSON.stringify(this.recentSearches));
    }
  }

  openSearchResultsOverlay(): void {
    this.showSearchResults = true;
    this.searchModalRef = this.modal.open(this.searchResultsOverlay, {
      size: 'xl',
      fullscreen: true,
      backdrop: 'static',
      modalDialogClass: 'search-results-modal'
    });

    this.searchModalRef.result.then(
      () => this.closeSearchResults(),
      () => this.closeSearchResults()
    );
  }

  closeSearchResults(): void {
    this.showSearchResults = false;
    this.searchResults = [];
    this.shopResults = [];
    this.activeFilters = [];
    if (this.searchModalRef) {
      this.searchModalRef.close();
    }
  }

  applyFilter(filterId: string): void {
    this.activeFilter = filterId;
    if (this.searchQuery && this.showSearchResults) {
      this.performSearch();
    }
  }

  openFilters(): void {
    this.showFilters = true;
  }

  closeFilters(): void {
    this.showFilters = false;
  }

  applySearchFilters(): void {
    this.showFilters = false;
    this.activeFilters = [];

    // Add active filters to display
    if (this.priceRange[0] > 0 || this.priceRange[1] < 5000) {
      this.activeFilters.push(`Price: ₹${this.priceRange[0]} - ₹${this.priceRange[1]}`);
    }

    if (this.selectedDeliveryTime && this.selectedDeliveryTime !== 'any') {
      const timeLabel = this.deliveryTimes.find(t => t.value === this.selectedDeliveryTime)?.label;
      if (timeLabel) {
        this.activeFilters.push(`Delivery: ${timeLabel}`);
      }
    }

    const selectedCategories = this.allCategories.filter(c => c.selected);
    selectedCategories.forEach(category => {
      this.activeFilters.push(category.name);
      this.selectedCategories.push(category.id);
    });

    // Perform search with new filters
    this.performSearch();
  }

  clearFilters(): void {
    this.priceRange = [0, 5000];
    this.selectedDeliveryTime = '';
    this.allCategories.forEach(category => {
      category.selected = false;
    });
    this.selectedCategories = [];
    this.activeFilters = [];
    this.showFilters = false;

    if (this.searchQuery && this.showSearchResults) {
      this.performSearch();
    }
  }

  removeFilter(filter: string): void {
    this.activeFilters = this.activeFilters.filter(f => f !== filter);

    // Update corresponding filter values
    if (filter.startsWith('Price:')) {
      this.priceRange = [0, 5000];
    } else if (filter.startsWith('Delivery:')) {
      this.selectedDeliveryTime = '';
    } else {
      const category = this.allCategories.find(c => c.name === filter);
      if (category) {
        category.selected = false;
        this.selectedCategories = this.selectedCategories.filter(id => id !== category.id);
      }
    }

    // Re-search if in results view
    if (this.showSearchResults) {
      this.performSearch();
    }
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }

    this.currentPage = page;
    this.performSearch();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;

    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  sortResults(): void {
    if (this.searchResults.length > 0) {
      switch (this.sortBy) {
        case 'price_low':
          this.searchResults.sort((a, b) => a.price - b.price);
          break;
        case 'price_high':
          this.searchResults.sort((a, b) => b.price - a.price);
          break;
        case 'rating':
          this.searchResults.sort((a, b) => b.rating - a.rating);
          break;
        case 'delivery':
          this.searchResults.sort((a, b) => a.delivery_time - b.delivery_time);
          break;
      }
      this.cdr.markForCheck();
    }
  }

  searchByCategory(category: any): void {
    this.searchQuery = category.name;
    this.performSearch();
  }

  // ========== EXISTING FUNCTIONALITY ==========

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

  visitStore(store: any): void {
    this.analytics.trackEvent('STORE_PROFILE_PAGE_REDIRECT_CLICKED', 'PAGE_VISIT', 1, `STORE: ${store.slug}`);
    if (store?.slug) this.router.navigate(['/store/profile', store.slug]);
  }

  /* STEP 1: LOAD CATEGORIES */
  loadCategories(): void {
    this.loadingCategories = true;

    // assume you already have this API
    this.categoryService.getCategories().subscribe(res => {
      this.categories = res?.results || [];
      this.initCategoryShelves();
      this.loadingCategories = false;
      this.cdr.markForCheck();
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

    this.loadProductsForCategory(nextCategory.slug);
  }

  addToCart(product: any): void {
    this.analytics.trackEvent('ADD_TO_CART_CLICKED', 'ECOMMERCE', 1, `PRODUCT_ID: ${product.id}`);

    // 🔐 Force login
    if (!this.authService.isLoggedIn()) {
      this.authModal.openLogin();

      // Wait for login success
      this.authService.isLoggedIn$.subscribe(() => {
        this.addToCart(product);
      });

      return;
    }

    product.qty = (product.qty || 0) + 1;

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
        this.cdr.markForCheck();
      },
      error: () => {
        product.qty = Math.max(0, (product.qty || 0) - 1);
        this.cdr.markForCheck();
      }
    });
  }

  openSubscribeModal(product: any): void {
    // 🔐 Force login before subscription
    if (!this.authService.isLoggedIn()) {
      this.authModal.openLogin();

      // Wait for login success
      this.authService.isLoggedIn$.subscribe(() => {
        this.openSubscribeModal(product);
      });
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
          this.toastr.success('Subscription added successfully!');
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
          this.cdr.markForCheck();
        },
        error: () => {
          product.qty += 1;
          this.cdr.markForCheck();
        }
      });
      return;
    }
    const newQty = currentQty - 1;
    product.qty = newQty;
    this.cartService.updateCartItem(product.id, newQty).subscribe({
      next: (res) => {
        if (!res.success) return;
        if (res.item) {
          product.qty = res.item.quantity;
        }
        this.headerService.updateCartSummary(res.cart);
        this.cdr.markForCheck();
      },
      error: (err) => {
        product.qty += 1;
        this.cdr.markForCheck();
      }
    });
  }

  increaseQty(product: any): void {
    const newQty = (product.qty || 0) + 1;
    product.qty = newQty;

    this.cartService.updateCartItem(product.id, newQty).subscribe({
      next: (res) => {
        if (!res.success) return;
        if (res.item) {
          product.qty = res.item.quantity;
        }
        this.headerService.updateCartSummary(res.cart);
        this.cdr.markForCheck();
      },
      error: () => {
        product.qty = Math.max(0, (product.qty || 0) - 1);
        this.cdr.markForCheck();
      }
    });
  }

  // Helper method to add search result to cart
  addSearchResultToCart(result: SearchResult): void {
    const product = {
      id: result.id,
      name: result.name,
      price: result.price,
      final_price: result.price,
      discount_value: result.original_price ? result.original_price - result.price : 0,
      image: result.image,
      rating: result.rating,
      shop: { name: result.shop_name },
      delivery_time: result.delivery_time,
      qty: 0
    };

    this.addToCart(product);
  }

  visitSearchResultShop(result: SearchResult): void {
    if (result.shop_id) {
      this.router.navigate(['/shop', result.shop_id]);
    } else {
      // Fallback: search for shop by name
      this.router.navigate(['/stores'], { queryParams: { search: result.shop_name } });
    }
  }

  // Host Listener for ESC key
  @HostListener('document:keydown.escape', ['$event'])
  handleEscapeKey(event: KeyboardEvent): void {
    if (this.showSearchResults) {
      this.closeSearchResults();
    }
    if (this.showSuggestions) {
      this.showSuggestions = false;
    }
    if (this.showFilters) {
      this.showFilters = false;
    }
  }
}