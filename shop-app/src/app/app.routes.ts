import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { AuthGuard } from './core/gaurds/auth.gaurd';

export const routes: Routes = [
  // Home is eagerly loaded for fast initial paint
  { path: '', component: HomeComponent },

  // Auth
  { path: 'auth', loadComponent: () => import('./components/auth/auth.component').then(m => m.AuthComponent) },

  // PUBLIC: Cart is accessible without login (login required only at checkout)
  { path: 'cart', loadComponent: () => import('./components/cart/cart.component').then(m => m.CartComponent) },

  // PROTECTED: Requires authentication
  { path: 'subscribe', loadComponent: () => import('./components/subscribe/subscribe.component').then(m => m.SubscriptionsComponent), canActivate: [AuthGuard] },
  { path: 'profile', loadComponent: () => import('./components/user-info/user-info.component').then(m => m.UserProfileComponent), canActivate: [AuthGuard] },
  { path: 'payment-status', loadComponent: () => import('./components/payment-status/payment-status.component').then(m => m.PaymentStatusComponent), canActivate: [AuthGuard] },
  { path: 'order-summary/:orderId', loadComponent: () => import('./components/order-summary/order-summary.component').then(m => m.OrderSummaryComponent), canActivate: [AuthGuard] },

  // PUBLIC: Product & shop browsing
  { path: 'category/:slug', loadComponent: () => import('./components/products/products.component').then(m => m.ProductsComponent) },
  { path: 'products/:slug', loadComponent: () => import('./components/products/products.component').then(m => m.ProductsComponent) },
  { path: 'product/:slug', loadComponent: () => import('./pages/product-detail/product-detail.component').then(m => m.ProductDetailComponent) },
  { path: 'stores/:slug', loadComponent: () => import('./components/vendor-products/vendor-products.component').then(m => m.VendorProductsComponent) },
  { path: 'shop/:slug', loadComponent: () => import('./components/vendor-profile/vendor-profile.component').then(m => m.VendorProfileComponent) },
  { path: 'stores-view-all', loadComponent: () => import('./components/vendor-list/vendor-list.component').then(m => m.VendorListComponent) },

  // PUBLIC: Static pages
  { path: 'about-us', loadComponent: () => import('./pages/about-us/about-us.component').then(m => m.AboutUsComponent) },
  { path: 'policy', loadComponent: () => import('./pages/policy/policy.component').then(m => m.PolicyComponent) },
  { path: 'contact-us', loadComponent: () => import('./pages/contact-us/contact-us.component').then(m => m.ContactUsComponent) },

  // Wildcard redirect
  { path: '**', redirectTo: '' },
];
