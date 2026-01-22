import { Component, OnInit } from '@angular/core';
import { ShopService } from '../../services/shop.service';
import { AnalyticsService } from '../../services/analytics.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HomeComponent } from '../home/home.component';
import { CategoryService } from '../../services/category.service';

@Component({
  selector: 'app-vendor-list',
  imports: [CommonModule,
    FormsModule],
  templateUrl: './vendor-list.component.html',
  styleUrl: './vendor-list.component.scss'
})
export class VendorListComponent implements OnInit {
  vendors: any[] = [];
  categories: any[] = [];
  loading = false;

  filters = {
    search: '',
    category__slug: '',
    sort_by: 'distance',
    is_accepting_orders: false,
    pincode: ''
  };
  constructor(
    private shopService: ShopService,
    private router: Router,
    private analytics: AnalyticsService,
    private categoryService: CategoryService) {

  }

  fetchVendors() {
    this.loading = true;

    this.shopService.getShopListWithFilter(this.filters)
      .subscribe({
        next: res => {
          this.vendors = res.results || [];
          this.loading = false;
        },
        error: () => {
          this.vendors = [];
          this.loading = false;
        }
      });
  }
  ngOnInit(): void {
    this.loading = true;
    this.fetchVendors();
    this.getCategories();
    this.loading = false;
  }

  applyFilters() {
    this.fetchVendors();
  }

  getCategories() {
    this.categoryService.getCategories().subscribe({
      next: (res: any) => { this.categories = res.results || []; },
      error: (err) => console.error('Error loading categories:', err),
    });
  }

  selectStore(store: any): void {
    this.analytics.trackEvent('STORE_PAGE_REDIRECT_CLICKED', 'PAGE_VISIT', 1, `STORE: ${store.slug}`);
    if (store?.slug) this.router.navigate(['/stores', store.slug]);
  }
}
