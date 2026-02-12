// vendor-profile.component.ts
import { Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShopService } from '../../services/shop.service';
import { Shop } from '../../models/vendor.model';
import { vProduct } from '../../models/product.model';
import { API_ENDPOINTS } from '../../shared/constants/api.constants';



interface Vendor {
  id: number;
  shopName: string;
  tagline: string;
  logo: string;
  coverImage: string;
  rating: number;
  reviewCount: number;
  deliveryTime: number;
  minFreeDelivery: number;
  distance: number;
  address: string;
  about: string;
  isVerified: boolean;
  storeHours: Array<{ day: string, hours: string }>;
}

@Component({
  selector: 'app-vendor-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vendor-profile.component.html',
  styleUrls: ['./vendor-profile.component.scss']
})
export class VendorProfileComponent implements OnInit {
  shopId!: number;
  shopSlug!: string;
  shop: Shop | null = null;
  categories: any[] = [];
  reviews: any[] = [];
  ratingDistribution: any[] = [];
  isFavorite = false;
  cartItemCount = 0;
  cartTotal = 0;
  vendorSlug: any;
  products: vProduct[] = [];
  filteredProducts: vProduct[] = [];
  currentPage = 1;
  hasNextPage = true;
  isLoading = false;
  selectedCategory: string = 'all';
  activeTab: string = 'products';




  constructor(private route: ActivatedRoute, private shopService: ShopService) { }
  @HostListener('window:scroll', [])
  onScroll(): void {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 200) {
      this.loadProducts();
    }
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.vendorSlug = params['slug'];
      this.loadVendorData();
      this.loadProducts();
      this.loadCategories();
      this.loadReviews();
      this.calculateCartTotal();
    });
  }

  setActiveTab(tabName: string) {
    this.activeTab = tabName;
  }

  loadVendorData(): void {
    this.shopService.getShopBySlug(this.vendorSlug).subscribe({
      next: res => {
        this.shop = res;
        this.shopSlug = res?.slug;
        this.shopId = res?.id;
      },
      error: () => {

      }
    })
  }

  loadProducts(reset: boolean = false): void {
    if (this.isLoading || !this.hasNextPage) return;

    this.isLoading = true;

    this.shopService.getShopProducts(
      this.vendorSlug,
      this.selectedCategory !== 'all'
        ? { categoryId: Number(this.selectedCategory) }
        : undefined,
      this.currentPage
    ).subscribe({
      next: (res) => {
        if (reset) {
          this.products = res.results || [];
        } else {
          this.products = [...this.products, ...(res.results || [])];
        }

        this.filteredProducts = [...this.products];
        this.hasNextPage = !!res.next;
        this.currentPage++;
        this.isLoading = false;
      },

      error: (err) => {
        console.error('Failed to load products', err);

        // If first load or filter change, show empty state
        if (reset || this.currentPage === 1) {
          this.products = [];
          this.filteredProducts = [];
        }

        // Stop further calls to prevent infinite retry loop
        this.hasNextPage = false;
        this.isLoading = false;
      }
    });
  }



  loadCategories(): void {
    this.shopService.getShopProductCategories(this.vendorSlug).subscribe({
      next: res => {
        this.categories = res;
      }
    })
  }

  loadReviews(): void {
    // Sample reviews
    this.reviews = [
      {
        userName: "Rahul Sharma",
        userAvatar: "https://i.pravatar.cc/150?img=1",
        rating: 5,
        comment: "Fresh produce and super fast delivery! The apples were amazing.",
        time: "2 days ago",
        images: []
      },
      {
        userName: "Priya Patel",
        userAvatar: "https://i.pravatar.cc/150?img=2",
        rating: 4,
        comment: "Good quality vegetables, delivery was on time.",
        time: "1 week ago",
        images: ["https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80"]
      }
    ];

    this.ratingDistribution = [
      { stars: 5, percentage: 70, count: 87 },
      { stars: 4, percentage: 20, count: 25 },
      { stars: 3, percentage: 5, count: 6 },
      { stars: 2, percentage: 3, count: 4 },
      { stars: 1, percentage: 2, count: 2 }
    ];
  }

  filterByCategory(categoryId: string): void {
    this.selectedCategory = categoryId;

    // Reset pagination
    this.currentPage = 1;
    this.hasNextPage = true;
    this.products = [];
    this.filteredProducts = [];

    this.loadProducts(true);
  }




  toggleFavorite(): void {
    this.isFavorite = !this.isFavorite;
    if (this.isFavorite) { this.shopService.addToFavorites(this.shopSlug).subscribe(); } else { this.shopService.removeFromFavorites(this.shopSlug).subscribe(); }
  }

  toggleProductWishlist(productId: number): void {
    const product = this.products.find(p => p.id === productId);
    if (product) {
      product.isWishlisted = !product.isWishlisted;
    }
  }

  addToCart(product: vProduct): void {
    product.inCart = 1;
    this.calculateCartTotal();
  }

  updateQuantity(productId: number, change: number): void {
    const product = this.products.find(p => p.id === productId);
    if (product) {
      product.inCart = Math.max(0, product.inCart + change);
      this.calculateCartTotal();
    }
  }

  calculateCartTotal(): void {
    this.cartItemCount = this.products.reduce((sum, product) => sum + product.inCart, 0);
    this.cartTotal = this.products.reduce(
      (sum, product) => sum + (product.price * product.inCart), 0
    );
  }

  private copyToClipboard(url: string): void {
    navigator.clipboard.writeText(url).then(() => {
      alert('Shop link copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy link:', err);
    });
  }

  shareShop(): void {
    const shopUrl = `${API_ENDPOINTS.SHOP_PROFILE}${this.shopSlug}`; // adjust as needed

    if (navigator.share) {
      navigator.share({
        title: 'Check out this shop!',
        text: 'Have a look at this store I found',
        url: shopUrl
      })
        .then(() => console.log('Shop shared successfully'))
        .catch(err => console.error('Error sharing:', err));
    } else {
      this.copyToClipboard(shopUrl);
    }
  }


  viewCart(): void {
    // Navigate to cart page
    console.log('View cart');
  }

  getRoundedRating(): number {
    return Math.round(this.shop?.rating || 4.5);
  }
}