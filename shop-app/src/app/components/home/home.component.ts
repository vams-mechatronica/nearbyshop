import { Component, OnInit, ViewChild, ElementRef, Injectable, AfterViewInit, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CategoryService } from '../../services/category.service';
import { BannerService } from '../../services/banner.service';


@Component({
  standalone: true,
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [CommonModule],
})

@Injectable({
  providedIn: 'root'
})
export class HomeComponent implements OnInit,AfterViewInit, OnDestroy {
  @ViewChild('bannerContainer', { static: true }) bannerContainer!: ElementRef;
  categories: any[] = [];
  banners: any[] = [];
  processedBanners: any[] = [];
  recentVisits = ['Groceries', 'Rice', 'Wheat'];
  currentIndex = 0;
  interval: any;
  observer!: IntersectionObserver;

  constructor(
    private router: Router,
    private categoryService: CategoryService,
    private bannerService: BannerService,
    
  ) { }

  ngOnInit(): void {
    this.categoryService.getCategories().subscribe((res: any) => {
      this.categories = res.results;
    });
    // this.loadBanners();
  }
  // ngOnDestroy() {
  //   if (this.interval) clearInterval(this.interval);
  // }


  @ViewChild('carousel') carousel!: ElementRef;

  scrollLeft() {
    this.carousel.nativeElement.scrollBy({ left: -200, behavior: 'smooth' });
  }

  scrollRight() {
    this.carousel.nativeElement.scrollBy({ left: 200, behavior: 'smooth' });
  }

  selectCategory(cat: any) {
    this.router.navigate(['/products', cat.slug]);
  }




  ngAfterViewInit() {
    // Lazy load banners when component enters viewport
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadBanners();
          this.observer.disconnect();
        }
      });
    }, { threshold: 0.1 });

    this.observer.observe(this.bannerContainer.nativeElement);
  }

  ngOnDestroy() {
    if (this.interval) clearInterval(this.interval);
    if (this.observer) this.observer.disconnect();
  }

  // loadBanners, prepareLoopBanners, startAutoScroll same as optimized version
  loadBanners() {
    this.bannerService.getBanners().subscribe({
      next: (res) => {
        const banners = res?.results || [];
        if (!banners.length) return;

        this.processedBanners = this.prepareLoopBanners(banners);

        if (this.processedBanners.length > 1) this.startAutoScroll();
      },
      error: (err) => console.error("Error fetching banners:", err)
    });
  }

  prepareLoopBanners(banners: any[]): any[] {
    const len = banners.length;
    if (len === 1) return [banners[0], banners[0], banners[0]];
    if (len === 2) return [...banners, banners[0]];
    return [...banners, ...banners.slice(0, 3)];
  }

  startAutoScroll() {
    if (this.interval) clearInterval(this.interval);

    this.interval = setInterval(() => {
      this.currentIndex++;
      if (this.currentIndex >= this.processedBanners.length - 3) {
        setTimeout(() => (this.currentIndex = 0), 700);
      }
    }, 3000);
  }



}
