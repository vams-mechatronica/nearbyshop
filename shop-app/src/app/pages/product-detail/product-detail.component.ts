import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Injectable, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductsService } from '../../services/products.service';
import { ProductsComponent } from '../../components/products/products.component';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { SubscriptionService } from '../../services/subscribe.service';
import { CartService } from '../../services/cart.service';
import { FormsModule } from '@angular/forms';
import { AuthModalService } from '../../services/auth-modal.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
  imports: [CommonModule, FormsModule, RouterLink]
})
@Injectable({ providedIn: 'root' })
export class ProductDetailComponent {
  product: any;
  selectedImage: string = '';
  relatedProducts: any[] = [];
  products: any[] = [];
  categoryName: string = 'Darity';
  categories: any[] = [];
  selectedProduct: any;
  subscriptionPlan = 'daily';
  startDate: string = '';

  @ViewChild('subscribeModal') subscribeModal!: TemplateRef<any>;
  private subscribeModalRef!: NgbModalRef;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductsService,
    private cdRef: ChangeDetectorRef,
    private productComp: ProductsComponent,
    private toastr: ToastrService,
    private modal: NgbModal,
    private subscribeService: SubscriptionService,
    private cartService: CartService,
    private authModal: AuthModalService,
    private authService: AuthService,
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
        this.cdRef.detectChanges(); // update view
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
    this.productComp.addToCart(product);
  }

  openSubscribeModal(product: any): void {

    // 🔐 Force login before subscription
    if (!this.authService.isLoggedIn()) {
      // save intent (optional but recommended)
      localStorage.setItem('redirect_url', '/subscribe');

      // open login modal
      this.authModal.openLogin();
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
        },
        error: (err) => {
          this.toastr.error(err.error.message, 'Subscription Failed');
        },
      });
  }

  viewProduct(id: number) {
    this.router.navigate(['/product', id]);
  }

  increaseQty(product: any): void {
    product.qty = (product.qty || 0) + 1;
    this.cartService.updateCartItem(product.id, product.qty).subscribe({
      next: (res) => console.log('Cart updated:', res),
      error: (err) => console.error('Cart update failed:', err),
    });
  }

  decreaseQty(product: any): void {
    if ((product.qty || 1) > 1) {
      product.qty -= 1;
      this.cartService.updateCartItem(product.id, product.qty).subscribe({
        next: (res) => console.log('Cart updated:', res),
        error: (err) => console.error('Cart update failed:', err),
      });
    } else {
      product.qty = 0;
      this.cartService.deleteCartItem(product.id).subscribe({
        next: (res) => console.log('Cart item removed:', res),
        error: (err) => console.error('Cart delete failed:', err),
      });
    }
  }
}
