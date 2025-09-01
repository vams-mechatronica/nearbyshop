import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { ProductsComponent } from './components/products/products.component';
import { CartComponent } from './components/cart/cart.component';
import { SubscriptionsComponent } from './components/subscribe/subscribe.component';
import { AuthComponent } from './components/auth/auth.component';
import { UserProfileComponent } from './components/user-info/user-info.component';
import { PaymentStatusComponent } from './components/payment-status/payment-status.component';
import { OrderSummaryComponent } from './components/order-summary/order-summary.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'auth', component: AuthComponent },
  { path: 'cart', component: CartComponent },
  { path: 'products/:slug', component: ProductsComponent },
  { path: 'subscribe', component: SubscriptionsComponent },
  { path: 'profile', component: UserProfileComponent },
  { path: 'payment-status', component: PaymentStatusComponent },
  { path: 'order-summary/:orderId', component: OrderSummaryComponent }
];

