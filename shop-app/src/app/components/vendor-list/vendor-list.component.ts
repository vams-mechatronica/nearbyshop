import { Component } from '@angular/core';
import { ShopService } from '../../services/shop.service';
import { AnalyticsService } from '../../services/analytics.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-vendor-list',
  imports: [],
  templateUrl: './vendor-list.component.html',
  styleUrl: './vendor-list.component.scss'
})
export class VendorListComponent {
  vendors: any[] = [];
  categories: any[] = [];
  loading = false;

  filters = {
    search: '',
    category: '',
    sort_by: 'distance',
    is_open: false,
    lat: null,
    lng: null,
  };
  constructor(
    private shopService: ShopService,
    private router: Router,
    private analytics: AnalyticsService,) {

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

  applyFilters() {
    this.fetchVendors();
  }

  selectStore(store: any): void {
    this.analytics.trackEvent('STORE_PAGE_REDIRECT_CLICKED', 'PAGE_VISIT', 1, `STORE: ${store.slug}`);
    if (store?.slug) this.router.navigate(['/stores', store.slug]);
  }
}
