import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
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
export class HomeComponent implements OnInit {
  categories: any[] = [];
  banners: any[] = [];
  processedBanners: any[] = [];
  recentVisits = ['Groceries', 'Rice', 'Wheat'];
  currentIndex = 0;
interval: any;

  constructor(
    private router: Router,
    private categoryService: CategoryService,
    private bannerService: BannerService
  ) { }

  ngOnInit(): void {
    this.categoryService.getCategories().subscribe((res: any) => {
      this.categories = res.results;
    });
    this.loadBanners();
  }
  ngOnDestroy() {
  if (this.interval) clearInterval(this.interval);
}


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




  loadBanners() {
  this.bannerService.getBanners().subscribe({
    next: (res) => {
      const banners = res?.results || [];
      this.processedBanners = this.prepareLoopBanners(banners);

      // start auto-scroll
      this.startAutoScroll();
    },
    error: (err) => console.error("Error fetching banners:", err)
  });
}

  prepareLoopBanners(banners: any[]): any[] {
  if (!banners || banners.length === 0) return [];

  if (banners.length === 1) {
    return [banners[0], banners[0], banners[0]];
  }

  if (banners.length === 2) {
    return [...banners, banners[0]];
  }

  // For smooth infinite loop, duplicate first 3 at end
  return [...banners, ...banners.slice(0, 3)];
}

startAutoScroll() {
  this.interval = setInterval(() => {
    this.currentIndex++;

    // If we reach the last clone, reset smoothly
    if (this.currentIndex >= this.processedBanners.length - 3) {
      setTimeout(() => {
        this.currentIndex = 0;
      }, 700); // wait till transition ends
    }
  }, 3000); // 3 seconds
}

}
