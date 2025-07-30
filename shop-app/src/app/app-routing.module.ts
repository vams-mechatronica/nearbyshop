import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { ProductsComponent } from './components/products/products.component';
import { CartComponent } from './components/cart/cart.component';
import { SubscribeComponent } from './components/subscribe/subscribe.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'products/:id', component: ProductsComponent },
  { path: 'cart', component: CartComponent },
  { path: 'subscribe', component: SubscribeComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
