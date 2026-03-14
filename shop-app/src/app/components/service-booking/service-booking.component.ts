import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbDatepickerModule, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { BookingService } from '../../services/booking.service';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { AuthModalService } from '../../services/auth-modal.service';
import {
  Service,
  ServiceProvider,
  TimeSlot,
  DayAvailability,
  BookingRequest
} from '../../models/booking.model';
import { Shop } from '../../models/vendor.model';

type BookingStep = 'service' | 'provider' | 'datetime' | 'confirm';

@Component({
  selector: 'app-service-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, NgbDatepickerModule],
  templateUrl: './service-booking.component.html',
  styleUrls: ['./service-booking.component.scss']
})
export class ServiceBookingComponent implements OnInit {
  @Input() shop!: Shop;
  
  // Current step
  currentStep: BookingStep = 'service';
  steps: BookingStep[] = ['service', 'provider', 'datetime', 'confirm'];
  
  // Data
  services: Service[] = [];
  providers: ServiceProvider[] = [];
  availability: DayAvailability[] = [];
  timeSlots: TimeSlot[] = [];
  
  // Selections
  selectedService: Service | null = null;
  selectedProvider: ServiceProvider | null = null;
  selectedDate: NgbDateStruct | null = null;
  selectedTimeSlot: TimeSlot | null = null;
  
  // Customer Details
  customerName: string = '';
  customerPhone: string = '';
  customerEmail: string = '';
  customerNotes: string = '';
  
  // UI State
  isLoading: boolean = false;
  isSubmitting: boolean = false;
  minDate: NgbDateStruct;
  maxDate: NgbDateStruct;
  
  // Category filter for services
  serviceCategories: string[] = [];
  selectedCategory: string = 'all';
  filteredServices: Service[] = [];
  
  constructor(
    public activeModal: NgbActiveModal,
    private bookingService: BookingService,
    private authService: AuthService,
    private userService: UserService,
    private authModalService: AuthModalService,
    private toastr: ToastrService
  ) {
    // Set min date to today
    const today = new Date();
    this.minDate = {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      day: today.getDate()
    };
    
    // Set max date to 30 days from now
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    this.maxDate = {
      year: maxDate.getFullYear(),
      month: maxDate.getMonth() + 1,
      day: maxDate.getDate()
    };
  }
  
  ngOnInit(): void {
    this.loadServices();
    this.prefillUserData();
  }
  
  private prefillUserData(): void {
    // Pre-fill customer data if logged in
    if (this.authService.isLoggedIn()) {
      this.userService.getUserInfo().subscribe({
        next: (user) => {
          this.customerName = user.username || '';
          this.customerPhone = user.phone_number?.replace(/^91/, '') || '';
          this.customerEmail = user.email || '';
        },
        error: () => {
          // Silent fail - user will enter data manually
        }
      });
    }
  }
  
  loadServices(): void {
    this.isLoading = true;
    
    // For development, use mock data
    // In production, use: this.bookingService.getShopServices(this.shop.slug)
    this.services = this.getMockServices();
    this.serviceCategories = [...new Set(this.services.map(s => s.category))];
    this.filteredServices = [...this.services];
    this.isLoading = false;
  }
  
  filterServices(category: string): void {
    this.selectedCategory = category;
    if (category === 'all') {
      this.filteredServices = [...this.services];
    } else {
      this.filteredServices = this.services.filter(s => s.category === category);
    }
  }
  
  selectService(service: Service): void {
    this.selectedService = service;
    this.loadProviders();
    this.goToStep('provider');
  }
  
  loadProviders(): void {
    this.isLoading = true;
    
    // For development, use mock data
    // In production: this.bookingService.getProvidersForService(this.shop.slug, this.selectedService.id)
    this.providers = this.getMockProviders();
    this.isLoading = false;
  }
  
  selectProvider(provider: ServiceProvider | null): void {
    this.selectedProvider = provider;
    this.loadAvailability();
    this.goToStep('datetime');
  }
  
  skipProviderSelection(): void {
    this.selectedProvider = null;
    this.loadAvailability();
    this.goToStep('datetime');
  }
  
  loadAvailability(): void {
    this.isLoading = true;
    
    // For development, use mock data
    // In production: this.bookingService.getAvailability(...)
    this.availability = this.bookingService.generateMockAvailability(14);
    this.isLoading = false;
  }
  
  onDateSelect(date: NgbDateStruct): void {
    this.selectedDate = date;
    this.selectedTimeSlot = null;
    this.loadTimeSlots();
  }
  
  loadTimeSlots(): void {
    if (!this.selectedDate) return;
    
    this.isLoading = true;
    const dateStr = this.formatDate(this.selectedDate);
    
    // Find slots for selected date from availability
    const dayAvailability = this.availability.find(a => a.date === dateStr);
    
    if (dayAvailability && dayAvailability.is_open) {
      this.timeSlots = dayAvailability.slots;
    } else {
      this.timeSlots = [];
    }
    
    this.isLoading = false;
  }
  
  selectTimeSlot(slot: TimeSlot): void {
    if (!slot.is_available) return;
    this.selectedTimeSlot = slot;
  }
  
  goToConfirm(): void {
    if (!this.selectedDate || !this.selectedTimeSlot) {
      this.toastr.warning('Please select a date and time slot');
      return;
    }
    this.goToStep('confirm');
  }
  
  goToStep(step: BookingStep): void {
    this.currentStep = step;
  }
  
  goBack(): void {
    const currentIndex = this.steps.indexOf(this.currentStep);
    if (currentIndex > 0) {
      this.currentStep = this.steps[currentIndex - 1];
    }
  }
  
  canGoBack(): boolean {
    return this.steps.indexOf(this.currentStep) > 0;
  }
  
  confirmBooking(): void {
    if (!this.validateBooking()) return;
    
    if (!this.authService.isLoggedIn()) {
      this.authModalService.openLogin();
      return;
    }
    
    this.isSubmitting = true;
    
    const bookingRequest: BookingRequest = {
      shop_id: this.shop.id,
      service_id: this.selectedService!.id,
      provider_id: this.selectedProvider?.id,
      booking_date: this.formatDate(this.selectedDate!),
      time_slot: this.selectedTimeSlot!.start_time,
      customer_name: this.customerName,
      customer_phone: this.customerPhone,
      customer_email: this.customerEmail || undefined,
      customer_notes: this.customerNotes || undefined
    };
    
    this.bookingService.createBooking(bookingRequest).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        if (response.success) {
          this.toastr.success('Booking confirmed successfully!');
          this.activeModal.close(response.booking);
        } else {
          this.toastr.error(response.message || 'Failed to create booking');
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.toastr.error('Failed to create booking. Please try again.');
        console.error('Booking error:', err);
      }
    });
  }
  
  private validateBooking(): boolean {
    if (!this.selectedService) {
      this.toastr.warning('Please select a service');
      return false;
    }
    if (!this.selectedDate) {
      this.toastr.warning('Please select a date');
      return false;
    }
    if (!this.selectedTimeSlot) {
      this.toastr.warning('Please select a time slot');
      return false;
    }
    if (!this.customerName.trim()) {
      this.toastr.warning('Please enter your name');
      return false;
    }
    if (!this.customerPhone.trim() || !/^\d{10}$/.test(this.customerPhone)) {
      this.toastr.warning('Please enter a valid 10-digit phone number');
      return false;
    }
    return true;
  }
  
  formatDate(date: NgbDateStruct): string {
    return `${date.year}-${date.month.toString().padStart(2, '0')}-${date.day.toString().padStart(2, '0')}`;
  }
  
  formatDisplayDate(date: NgbDateStruct): string {
    const d = new Date(date.year, date.month - 1, date.day);
    return d.toLocaleDateString('en-IN', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  }
  
  formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${minutes} ${ampm}`;
  }
  
  isDateDisabled = (date: NgbDateStruct): boolean => {
    const dateStr = this.formatDate(date);
    const dayAvailability = this.availability.find(a => a.date === dateStr);
    return !dayAvailability || !dayAvailability.is_open;
  };
  
  getStepNumber(step: BookingStep): number {
    return this.steps.indexOf(step) + 1;
  }
  
  isStepCompleted(step: BookingStep): boolean {
    const currentIndex = this.steps.indexOf(this.currentStep);
    const stepIndex = this.steps.indexOf(step);
    return stepIndex < currentIndex;
  }
  
  getSubtotal(): number {
    return this.selectedService?.price || 0;
  }
  
  // Mock Data Methods for Development
  private getMockServices(): Service[] {
    return [
      {
        id: 1,
        name: 'Haircut - Men',
        description: 'Professional haircut with styling',
        price: 200,
        duration_minutes: 30,
        category: 'Hair',
        // image: 'assets/images/services/haircut.jpg',
        is_active: true
      },
      {
        id: 2,
        name: 'Haircut - Women',
        description: 'Haircut with wash and blow dry',
        price: 500,
        duration_minutes: 60,
        category: 'Hair',
        is_active: true
      },
      {
        id: 3,
        name: 'Hair Color',
        description: 'Full hair coloring with premium products',
        price: 1500,
        duration_minutes: 120,
        category: 'Hair',
        is_active: true
      },
      {
        id: 4,
        name: 'Facial - Basic',
        description: 'Basic cleanup facial for glowing skin',
        price: 600,
        duration_minutes: 45,
        category: 'Skin',
        is_active: true
      },
      {
        id: 5,
        name: 'Facial - Premium',
        description: 'Premium facial with gold mask treatment',
        price: 1200,
        duration_minutes: 60,
        category: 'Skin',
        is_active: true
      },
      {
        id: 6,
        name: 'Manicure',
        description: 'Complete manicure with nail art',
        price: 400,
        duration_minutes: 45,
        category: 'Nails',
        is_active: true
      },
      {
        id: 7,
        name: 'Pedicure',
        description: 'Relaxing pedicure with foot massage',
        price: 500,
        duration_minutes: 45,
        category: 'Nails',
        is_active: true
      },
      {
        id: 8,
        name: 'Full Body Massage',
        description: 'Relaxing full body massage (60 mins)',
        price: 1500,
        duration_minutes: 60,
        category: 'Spa',
        is_active: true
      }
    ];
  }
  
  private getMockProviders(): ServiceProvider[] {
    return [
      {
        id: 1,
        name: 'Priya Sharma',
        avatar: 'https://i.pravatar.cc/150?img=5',
        role: 'Senior Stylist',
        specializations: ['Hair Color', 'Bridal Styling'],
        rating: 4.8,
        review_count: 124,
        experience_years: 8,
        is_available: true
      },
      {
        id: 2,
        name: 'Rahul Kumar',
        avatar: 'https://i.pravatar.cc/150?img=8',
        role: 'Hair Stylist',
        specializations: ['Men\'s Haircut', 'Beard Styling'],
        rating: 4.6,
        review_count: 89,
        experience_years: 5,
        is_available: true
      },
      {
        id: 3,
        name: 'Anjali Patel',
        avatar: 'https://i.pravatar.cc/150?img=9',
        role: 'Beautician',
        specializations: ['Facial', 'Skin Care', 'Makeup'],
        rating: 4.9,
        review_count: 156,
        experience_years: 10,
        is_available: true
      },
      {
        id: 4,
        name: 'Vikram Singh',
        avatar: 'https://i.pravatar.cc/150?img=12',
        role: 'Spa Therapist',
        specializations: ['Massage', 'Aromatherapy'],
        rating: 4.7,
        review_count: 98,
        experience_years: 6,
        is_available: false
      }
    ];
  }
}
