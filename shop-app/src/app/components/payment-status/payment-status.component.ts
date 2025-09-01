import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-payment-status',
  templateUrl: './payment-status.component.html',
  imports: [CommonModule]
})
export class PaymentStatusComponent implements OnInit {
  status: 'success' | 'failed' | null = null;
  orderId: string | null = null;
  countdown = 5;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.status = this.route.snapshot.queryParamMap.get('status') as 'success' | 'failed';
    this.orderId = this.route.snapshot.queryParamMap.get('orderId');

    if (this.status === 'success' && this.orderId) {
      // Auto redirect after 5 seconds
      const interval = setInterval(() => {
        this.countdown--;
        if (this.countdown === 0) {
          clearInterval(interval);
          this.router.navigate(['/order-summary', this.orderId]);
        }
      }, 1000);
    }
  }

  retryPayment() {
    if (this.orderId) {
      // You can re-trigger your payment API here
      this.router.navigate(['/order-summary', this.orderId]); 
    }
  }

  redirectOrderSummaryPage(){
    this.router.navigate(['/order-summary', this.orderId])
  }
}
