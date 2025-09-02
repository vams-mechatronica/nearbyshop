import { Component, Injectable, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Order } from '../../models/order.model';
import { OrderService } from '../../services/order.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-order-summary',
  templateUrl: './order-summary.component.html',
  imports: [CommonModule]
})
@Injectable({
  providedIn: 'root'
})
export class OrderSummaryComponent implements OnInit {
  orderSummary?: Order;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('orderId')!;
    this.orderService.getOrderSummary(orderId).subscribe({
      next: (data) => {
        this.orderSummary = data;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  retryPayment(){
    
  }
}
