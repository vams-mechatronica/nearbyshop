// vendor-profile.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShopService } from '../../services/shop.service';
import { Shop } from '../../models/vendor.model';
import { vProduct } from '../../models/product.model';



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
  products: vProduct[] = [];
  filteredProducts: vProduct[] = [];
  categories: any[] = [];
  reviews: any[] = [];
  ratingDistribution: any[] = [];
  isFavorite = false;
  cartItemCount = 0;
  cartTotal = 0;
  vendorSlug: any;
  selectedCategory: any;

  constructor(private route: ActivatedRoute, private shopService: ShopService) { }

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

  loadProducts(): void {
    this.shopService.getShopProducts(this.vendorSlug).subscribe({
      next: res => {
        this.products = res;              
        this.filteredProducts = [...res];
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
    if (categoryId === 'all') {
      this.loadProducts();
    } else {
      this.shopService.getShopProducts(this.vendorSlug, {
        categoryId: Number(categoryId)
      }).subscribe(res => {
        this.products = res;
        this.filteredProducts = [...res];
      });
    }
  }



  toggleFavorite(): void {
    this.isFavorite = !this.isFavorite;
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

  shareShop(): void {
    // Implement share functionality
    console.log('Sharing shop');
  }

  viewCart(): void {
    // Navigate to cart page
    console.log('View cart');
  }

  getRoundedRating(): number {
    return Math.round(this.shop?.rating || 4.5);
  }
}