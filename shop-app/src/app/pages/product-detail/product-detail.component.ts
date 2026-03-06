import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductsService } from '../../services/products.service';
import { CartActionsService } from '../../shared/services/cart-actions.service';
import { FormsModule } from '@angular/forms';
import { Meta, Title } from '@angular/platform-browser';
import { SeoService } from '../../services/seo.service';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
  imports: [CommonModule, FormsModule, ProductCardComponent]
})
export class ProductDetailComponent {
  product: any;
  selectedImage: string = '';
  relatedProducts: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductsService,
    private cdRef: ChangeDetectorRef,
    public cartActions: CartActionsService,
    private meta: Meta,
    private title: Title,
    private seoService: SeoService,
  ) { }

  ngOnInit(): void {
    // Subscribe to route params changes
    this.route.params.subscribe(params => {
      const productSlug = params['slug'];
      if (productSlug) {
        this.loadProductSlug(productSlug);
        this.loadRelatedProductsSlug(productSlug);
      }
    });
  }

  private loadProduct(productId: string) {
    this.productService.getProductDetailById(productId).subscribe({
      next: (res) => {
        this.product = res;
        const primary = this.product.images?.find((img: any) => img.is_primary);
        this.selectedImage = primary ? primary.image : this.product.image;
        this.cdRef.detectChanges(); // update view
      },
      error: (err) => console.error(err),
    });
  }
  private loadProductSlug(productSlug: string) {
    this.productService.getProductDetailBySlug(productSlug).subscribe({
      next: (res) => {
        this.product = res;
        const primary = this.product.images?.find((img: any) => img.is_primary);
        this.selectedImage = primary ? primary.image : this.product.image;
        
        this.seoService.setProductSEO(this.product);
        this.seoService.setProductSchema(this.product);
        this.seoService.setCanonicalUrl(
          `${window.location.origin}/product/${this.product.slug}`
        );
        this.cdRef.detectChanges();
      },
      error: (err) => console.error(err),
    });
  }

  private loadRelatedProducts(productId: string) {
    this.productService.getRelatedProductById(productId).subscribe({
      next: (res) => {
        this.relatedProducts = res.results;
      },
      error: (err) => console.error(err),
    });
  }

  private loadRelatedProductsSlug(productSlug: string) {
    this.productService.getRelatedProductBySlug(productSlug).subscribe({
      next: (res) => {
        this.relatedProducts = res.results;
      },
      error: (err) => console.error(err),
    });
  }

  addToCart(product: any) {
    this.cartActions.addToCart(product);
  }

  openSubscribeModal(product: any): void {
    this.cartActions.openSubscribeModal(product);
  }

  viewProduct(id: number) {
    this.router.navigate(['/product', id]);
  }

  decreaseQty(product: any): void {
    this.cartActions.decreaseQty(product);
  }

  increaseQty(product: any): void {
    this.cartActions.increaseQty(product);
  }

}
