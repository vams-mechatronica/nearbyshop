import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CartActionsService } from '../../shared/services/cart-actions.service';
import { ProductsService } from '../../services/products.service';
import { CategoryService } from '../../services/category.service';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../../services/storage.service';


import { LoaderService } from '../../services/loader.service';
import { HostListener } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';


@Component({
  standalone: true,
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss'],
  imports: [CommonModule, FormsModule, RouterLink, ProductCardComponent],
})
export class ProductsComponent implements OnInit {
  products: any[] = [];
  categoryName: string = 'Darity';
  categorySlug: string = '';
  categories: any[] = [];

  currentPage = 1;
  pageSize = 12;
  hasMore = true;
  isLoading = false;
  showCategories = false;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductsService,
    private categoryService: CategoryService,
    private storageService: StorageService,
    private loaderService: LoaderService,
    private cdr: ChangeDetectorRef,
    public cartActions: CartActionsService,
  ) { }

  @ViewChild('productScroller', { static: true })
  productScroller!: any;

  private scrollTimeout: any;

  onProductScroll(): void {
    if (this.isLoading || !this.hasMore) return;

    clearTimeout(this.scrollTimeout);

    this.scrollTimeout = setTimeout(() => {
      const el = this.productScroller.nativeElement;

      const reachedBottom =
        el.scrollTop + el.clientHeight >= el.scrollHeight - 150;

      if (reachedBottom) {
        this.loadProducts();
      }
    }, 200);
  }


  ngOnInit(): void {
    setTimeout(() => {
      this.loaderService.show();
    });
    this.getCategory();

    this.route.paramMap.subscribe(params => {
      this.categorySlug = params.get('slug') || '';

      if (this.categorySlug) {
        this.categoryName = this.categorySlug;
      }

      // RESET STATE
      this.products = [];
      this.currentPage = 1;
      this.hasMore = true;

      this.loadProducts();
    });
  }

  getCategory() {
    this.categoryService.getCategories().subscribe({
      next: (res: any) => (this.categories = res.results),
      error: (err) => console.error('Error fetching categories:', err),
    });
  }

  loadProducts(reset = false): void {
    if (reset) {
      this.currentPage = 1;
      this.products = [];
      this.hasMore = true;
    }

    if (this.isLoading || !this.hasMore) return;

    this.isLoading = true;
    this.loaderService.show();

    const pincode = this.storageService.getItem('postal_code');
    // console.log(pincode);

    let request$;

    if (this.categorySlug && pincode) {
      request$ = this.productService.getProductsByCategorySlugPaginationPincode(
        this.categorySlug,
        pincode,
        this.currentPage,
        this.pageSize
      );
    }
    else if (this.categorySlug) {
      request$ = this.productService.getProductsByCategorySlugPagination(
        this.categorySlug,
        this.currentPage,
        this.pageSize
      );
    }
    else {
      request$ = this.productService.getProductsPaginated(
        this.currentPage,
        this.pageSize
      );
    }

    request$.subscribe({
      next: (res: any) => {
        const results = res?.results ?? [];

        this.products = [...this.products, ...results];
        this.hasMore = !!res?.next;
        this.currentPage++;
      },

      error: () => {
        this.hasMore = false;
      },

      complete: () => {
        this.isLoading = false;
        this.loaderService.hide();
      }
    });
  }



  addToCart(product: any): void {
    this.cartActions.addToCart(product);
  }

  openSubscribeModal(product: any): void {
    this.cartActions.openSubscribeModal(product);
  }

  decreaseQty(product: any): void {
    this.cartActions.decreaseQty(product);
  }

  increaseQty(product: any): void {
    this.cartActions.increaseQty(product);
  }


  onCategoryChange(categorySlug: string): void {
    // Avoid reloading same category
    if (this.categorySlug === categorySlug) {
      return;
    }

    this.categorySlug = categorySlug;
    this.categoryName = categorySlug;

    // RESET PAGINATION
    this.products = [];
    this.currentPage = 1;
    this.hasMore = true;

    // LOAD PRODUCTS
    this.loadProducts();
  }

  trackById(index: number, item: any): number { return item.id; }
  trackByIndex(index: number): number { return index; }
}
