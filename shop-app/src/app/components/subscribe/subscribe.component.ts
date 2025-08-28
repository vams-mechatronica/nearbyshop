import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubscriptionService } from '../../services/subscribe.service';
import { WalletService } from '../../services/wallet.service';


@Component({
  standalone: true,
  selector: 'app-subscriptions',
  templateUrl: './subscribe.component.html',
  styleUrls: ['./subscribe.component.scss'],
  imports: [CommonModule, FormsModule]
})
export class SubscriptionsComponent implements OnInit {
  subscriptions: any[] = [];
  selectedAddress: any = {};
  walletBalance: number = 0;

  constructor(
    private subscriptionService: SubscriptionService,
    private walletService: WalletService
  ) { }

  ngOnInit(): void {
    this.loadSubscriptions();
    this.loadWalletBalance();
    this.loadSelectedAddress();
  }

  loadSubscriptions() {
    this.subscriptionService.getSubscriptions().subscribe({
      next: (res: any) => {
        // res.results contains the actual subscription list
        this.subscriptions = res?.results || [];
        console.log('Subscriptions:', this.subscriptions);
      },
      error: (err) => console.error('Failed to fetch subscriptions:', err)
    });
  }


  loadWalletBalance() {
    // this.walletService.getWalletBalance().subscribe({
    //   next: (res: any) => {
    //     this.walletBalance = res.balance;
    //   },
    //   error: (err) => console.error('Failed to fetch wallet balance:', err)
    // });
  }

  addFunds() {
    // Logic to add funds to the wallet
    console.log('Adding funds to wallet');
  }

  loadSelectedAddress() {
    // Mock selected address for now
    this.selectedAddress = {
      name: 'John Doe',
      street: '123 MG Road',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001',
      phone: '9876543210'
    };
  }

// Example

editFrequency(sub: any) {
  // Open modal or dropdown to change subscription frequency
  console.log('Editing frequency for:', sub);
}

pauseSubscription(sub: any) {
  // Call API to pause the subscription
  console.log('Pausing subscription:', sub);
}

}
