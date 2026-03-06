import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CartActionsService } from '../../services/cart-actions.service';

@Component({
  standalone: true,
  selector: 'app-subscribe-modal',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4">
      <h5 class="mb-3">Subscribe to Product</h5>

      <div class="d-flex align-items-center mb-3">
        <img [src]="product?.image || 'assets/images/no-image.jpg'" alt="Product Image"
          style="width: 100px; height: 60px; object-fit: cover; border-radius: 4px; margin-right: 10px;" />

        <div class="flex-grow-1 subscribe-product-name">
          <div class="fw-bold">{{ product?.name }}</div>
          <div class="text-muted">Unit: {{ product?.unit?.code }}</div>
          <div class="text-muted small">₹{{ product?.final_price }}</div>
        </div>

        <div class="quantity-box d-flex align-items-center border rounded px-2 py-1"
          style="width: fit-content; height: 38px;">
          <button class="qty-btn" (click)="onDecreaseQty()">−</button>
          <input type="number" [(ngModel)]="product.qty"
            (ngModelChange)="product.qty = product.qty < 1 ? 1 : product.qty"
            class="qty-input mx-2" style="width: 50px; text-align: center; border: none; outline: none; height: 100%;"
            min="1" />
          <button class="qty-btn" (click)="onIncreaseQty()">+</button>
        </div>
      </div>

      <div class="mb-3">
        <div class="form-floating mb-3">
          <select class="form-select form-select-sm" [(ngModel)]="subscriptionPlan" id="subscription-select">
            <option value="daily">Daily</option>
            <option value="alternate_day">Alternate Day</option>
            <option value="every_3_days">Every 3 Days</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Biweekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <label for="subscription-select">Pick a Schedule</label>
        </div>
        <div class="form-floating mb-3">
          <input type="date" [(ngModel)]="startDate" class="form-control form-control-sm mt-2"
            placeholder="Pick a Start date" id="schedule-date" />
          <label for="schedule-date">Pick a start date</label>
        </div>
      </div>

      <div class="mb-3">
        <label class="form-label fw-semibold">Terms & Conditions</label>
        <p class="small text-muted mb-0">
          &bull; You can cancel or reschedule your subscription at any time.<br />
          &bull; Minimum commitment of 7 days is required.<br />
          &bull; Delivery will be paused on public holidays.
        </p>
      </div>

      <div class="text-end">
        <button class="btn btn-secondary btn-sm me-2" (click)="activeModal.dismiss()">Cancel</button>
        <button class="btn btn-success btn-sm" (click)="confirm()">Confirm</button>
      </div>
    </div>
  `
})
export class SubscribeModalComponent {
  @Input() product: any;

  subscriptionPlan = 'daily';
  startDate: string = '';

  constructor(
    public activeModal: NgbActiveModal,
    private cartActions: CartActionsService,
  ) {}

  onDecreaseQty(): void {
    if (this.product.qty > 1) {
      this.product.qty--;
    }
  }

  onIncreaseQty(): void {
    this.product.qty++;
  }

  confirm(): void {
    if (!this.product) return;

    this.cartActions.confirmSubscription(
      this.product,
      this.subscriptionPlan,
      this.startDate,
      this.product.qty,
      this.activeModal,
    );
  }
}
