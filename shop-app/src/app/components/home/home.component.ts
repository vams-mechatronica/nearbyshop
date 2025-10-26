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
import { Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { CategoryService } from '../../services/category.service';
import { BannerService } from '../../services/banner.service';
import { StorageService } from '../../services/storage.service';

@Component({
  standalone: true,
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [CommonModule],
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

  /** Recent Visit & Banner State */
  recentVisits = ['Groceries', 'Rice', 'Wheat'];
  currentBannerIndex = 0;

  /** Utilities */
  private interval!: ReturnType<typeof setInterval>;
  private observer!: IntersectionObserver;

  constructor(
    private router: Router,
    private categoryService: CategoryService,
    private bannerService: BannerService,
    private storageService: StorageService,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  // ────────────────────────────────
  // 🧩 INIT
  // ────────────────────────────────
  ngOnInit(): void {
    this.fetchCategories();
    this.fetchStores();
    this.fetchBanners(); // initial load
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
      next: (res: any) => {this.categories = res.results || [],this.cdr.markForCheck();},
      error: (err) => console.error('Error loading categories:', err),
    });
  }

  fetchStores(): void {
    this.categoryService.getStores().subscribe({
      next: (res: any) => (this.stores = res.results || [], this.cdr.markForCheck()),
      error: (err) => console.error('Error loading stores:', err),
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
          const img = new Image();
          img.src = b.image + '?f_auto,q_auto,w_1600,h_600,c_fill';
          img.onload = () => resolve({ ...b, cachedSrc: img.src });
          img.onerror = () => resolve({ ...b, cachedSrc: b.image }); // fallback
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

  scrollRight(carousel: HTMLElement): void {
    carousel.scrollBy({ left: 300, behavior: 'smooth' });
  }

  // ────────────────────────────────
  // 🧭 NAVIGATION
  // ────────────────────────────────
  selectCategory(cat: any): void {
    if (cat?.slug) this.router.navigate(['/products', cat.slug]);
  }

  selectStore(store: any): void {
    if (store?.slug) this.router.navigate(['/stores', store.slug]);
  }
}
