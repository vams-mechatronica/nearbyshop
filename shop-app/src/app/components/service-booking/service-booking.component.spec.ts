import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ServiceBookingComponent } from './service-booking.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ToastrModule } from 'ngx-toastr';

describe('ServiceBookingComponent', () => {
  let component: ServiceBookingComponent;
  let fixture: ComponentFixture<ServiceBookingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ServiceBookingComponent,
        HttpClientTestingModule,
        ToastrModule.forRoot()
      ],
      providers: [NgbActiveModal]
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceBookingComponent);
    component = fixture.componentInstance;
    component.shop = {
      id: 1,
      name: 'Test Salon',
      slug: 'test-salon',
      shop_image: '',
      category: 1,
      is_accepting_orders: true,
      created_at: '',
      updated_at: '',
      address: 'Test Address',
      delivery_time_min: 30,
      delivery_time_max: 60,
      delivery_fee: 0,
      minimum_order: 0,
      free_delivery_threshold: 0,
      is_featured: false,
      rating: 4.5,
      review_count: 100,
      total_orders: 500,
      response_rate: 95,
      delivery_success_rate: 98,
      categories: [],
      store_hours: [],
      vendor_name: 'Test Vendor',
      vendor_is_verified: true,
      is_service_provider: true,
      accepts_booking: true
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load services on init', () => {
    expect(component.services.length).toBeGreaterThan(0);
  });

  it('should filter services by category', () => {
    component.filterServices('Hair');
    expect(component.filteredServices.every(s => s.category === 'Hair')).toBeTruthy();
  });

  it('should validate booking before submission', () => {
    component.selectedService = null;
    expect(component['validateBooking']()).toBeFalsy();
  });

  it('should format date correctly', () => {
    const date = { year: 2026, month: 3, day: 10 };
    expect(component.formatDate(date)).toBe('2026-03-10');
  });

  it('should format time correctly', () => {
    expect(component.formatTime('09:30')).toBe('9:30 AM');
    expect(component.formatTime('14:30')).toBe('2:30 PM');
  });
});
