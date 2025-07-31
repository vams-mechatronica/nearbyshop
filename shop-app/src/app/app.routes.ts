// import { Routes } from '@angular/router';

// export const routes: Routes = [];
import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { ProductsComponent } from './components/products/products.component';
import { CartComponent } from './components/cart/cart.component';
import { SubscribeComponent } from './components/subscribe/subscribe.component';
import { AuthComponent } from './components/auth/auth.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'products/:slug', component: ProductsComponent },
  { path: 'cart', component: CartComponent },
  { path: 'subscribe', component: SubscribeComponent },
  { path: 'auth', component: AuthComponent },
];
