import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ProductsService } from '../../services/products.service';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
  imports: [CommonModule]
})
export class ProductDetailComponent {
  product: any;
  selectedImage: string = '';
  relatedProducts: any[] = [];

  constructor(private route: ActivatedRoute, private router: Router,
    private productService: ProductsService, private cdRef: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Example product (replace with API call later)
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.productService.getProductDetailById(productId).subscribe({
        next: (res) => {this.product = res;

          const primary = this.product.images?.find((img: any) => img.is_primary);
          this.selectedImage = primary ? primary.image : this.product.image;

          // 👇 Tell Angular to update the view
          this.cdRef.detectChanges();

        },
        error: (err) => console.error(err),
      });
    }
    if (productId){
      this.productService.getRelatedProductById(productId).subscribe({
        next: (res) => {
          this.relatedProducts = res.results;
        },
        error: (err) => console.error(err),
      });

    }
  }

  addToCart(product: any) {
    console.log('Added to cart:', product);
  }

  subscribeProduct(product: any) {
    console.log('Subscribed:', product);
  }

  viewProduct(id: number) {
    this.router.navigate(['/product', id]);
  }
}
