import {
  Component,
  HostListener,
  inject,
  Inject,
  OnInit,
  PLATFORM_ID,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AuthComponent } from '../auth/auth.component';
import { UserService } from '../../services/user.service';
import {
  Observable,
  Subject,
  debounceTime,
  distinctUntilChanged,
  of,
  switchMap,
} from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { API_ENDPOINTS } from '../../shared/constants/api.constants';
import { StorageService } from '../../services/storage.service';
import { HeaderCountService } from '../../services/header.service';
import { LoaderService } from '../../services/loader.service';
import { AuthService } from '../../services/auth.service';
import { LocationService } from '../../services/location.service';
import { CurrentLocation, DeliveryInfo, LocationSuggestion, SavedAddress } from '../../types/location.types';
import { AnalyticsService } from '../../services/analytics.service';
import { ShopService } from '../../services/shop.service';
@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
})
export class HeaderComponent implements OnInit {
  searchQuery = '';
  searchResults: any[] = [];
  searchSubject = new Subject<string>();
  locationSearch = '';
  locationError = '';
  checkingDelivery = false;
  selectedLocationName: string | null = null;
  userName = 'John Doe';
  showProfileDropdown = false;
  cartCount = 0;
  subscriptionCount = 0;
  selectedLocation: string | null = null;
  locations = [
    { id: 1, name: 'Noida' },
    { id: 2, name: 'Delhi' },
    { id: 3, name: 'Gurgaon' },
  ];
  sectorName: string | null = null;
  addressRest: any;
  deliveryTime: string = '';
  isBrowser = false;
  isLoggedIn$!: Observable<boolean>;

  @ViewChild('locationModal') locationModal!: TemplateRef<any>;
  @ViewChild('addressModal') addressModal!: TemplateRef<any>;

  // Current location data
  currentLocation: CurrentLocation | null = null;
  deliveryInfo: DeliveryInfo | null = null;

  // Saved addresses
  savedAddresses: SavedAddress[] = [];
  selectedAddress: SavedAddress | null = null;

  // UI state
  locationSearchControl = new FormControl('');
  locationSuggestions: LocationSuggestion[] = [];
  showSuggestions = false;
  isLoading = false;
  isSavingAddress = false;

  radius = 1;

  // Address form
  addressForm: Partial<SavedAddress> = {
    type: 'home',
    isDefault: false,
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    name: '',
    recipientName: '',
    phone: ''
  };
  isEditingAddress = false;
  editingAddressId: string | null = null;
  private locationChecked = false;

  loader = inject(LoaderService);

  constructor(
    private router: Router,
    private modalService: NgbModal,
    private userService: UserService,
    private storage: StorageService,
    private storageService: StorageService,
    private http: HttpClient,
    private headerService: HeaderCountService,
    private authService: AuthService,
    private locationService: LocationService,
    private analytics: AnalyticsService,
    private shopService: ShopService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  // Add the missing onNavClick method
  onNavClick(): void {
    this.loader.show();
    this.analytics.trackEvent('CART_REDIRECT_CLICKED', 'PAGE_VISIT', 1);
  }

  ngOnInit(): void {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isLoggedIn$ = this.authService.isLoggedIn$;

    if (!this.authService.hasValidToken()) {
      this.authService.logout();
    }

    this.headerService.counts$.subscribe((counts) => {
      this.cartCount = counts.cart_count;
      this.subscriptionCount = counts.subscription_count;
    });

    this.headerService.fetchCounts();

    // Setup live search stream
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query: string) =>
          this.http.get<any[]>(`${API_ENDPOINTS.SEARCH}${query}`)
        )
      )
      .subscribe({
        next: (res: any) => {
          this.searchResults = res.results;
        },
        error: (err) => {
          console.error('Search error:', err);
          this.searchResults = [];
        },
      });

    // Subscribe to location changes
    this.locationService.currentLocation$.subscribe(location => {
      this.currentLocation = location;
      if (location) {
        this.updateDisplayLocation();
      }
    });

    // Subscribe to saved addresses
    this.locationService.savedAddresses$.subscribe(addresses => {
      this.savedAddresses = addresses;
      this.selectedAddress = addresses.find(addr => addr.isDefault) || null;
    });

    // Subscribe to delivery info
    this.locationService.deliveryInfo$.subscribe(info => {
      this.deliveryInfo = info;
    });

    // Setup location search with debounce
    this.locationSearchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (query && query.length >= 3) {
          this.isLoading = true;
          return this.locationService.searchPlaces(query);
        }
        return of([]);
      })
    ).subscribe({
      next: (suggestions) => {
        this.locationSuggestions = suggestions;
        this.showSuggestions = suggestions.length > 0;
        this.isLoading = false;
      },
      error: () => {
        this.locationSuggestions = [];
        this.showSuggestions = false;
        this.isLoading = false;
      }
    });

    // Load saved location on init
    if (this.isBrowser) {
      this.loadSavedLocation();
      this.checkUserLocation();
    }
  }

  getUserInfo() {
    this.userService.getUserInfo().subscribe({
      next: (res) => {
        this.userName = res.username;
      },
      error: (err) => console.error(err),
    });
  }

  loginSignup(): void {
    this.analytics.trackEvent('LOGIN_CLICKED', 'EVENT_TRIGGERED', 1);
    this.modalService.open(AuthComponent, { centered: true, size: 'sm' });
  }

  onSearchChange(query: string): void {
    this.searchQuery = query;
    if (query.trim().length > 1) {
      this.searchSubject.next(query);
    } else {
      this.searchResults = [];
    }
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/search'], {
        queryParams: { q: this.searchQuery },
      });
      this.searchResults = [];
    }
  }

  selectResult(item: any): void {
    this.router.navigate(['/product', item.id]);
    this.searchResults = [];
    this.searchQuery = '';
  }

  toggleProfileDropdown(event: Event): void {
    event.stopPropagation();
    this.showProfileDropdown = !this.showProfileDropdown;
  }

  userProfile(): void {
    this.showProfileDropdown = false;
    this.router.navigate(['/profile']);
  }

  logout(): void {
    this.showProfileDropdown = false;
    this.authService.logout();
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-nav')) {
      this.showProfileDropdown = false;
    }
    if (!target.closest('.search-bar')) {
      this.searchResults = [];
    }
    if (!target.closest('.search-container')) {
      this.showSuggestions = false;
    }
  }

  // Open main location modal
  openLocationModal(): void {
    if (this.locationChecked) return;
    this.locationChecked = true;
    const modalRef = this.modalService.open(this.locationModal, {
      size: 'lg',
      backdrop: 'static',
      centered: true,
      windowClass: 'location-modal'
    });
    this.analytics.trackEvent('SELECT_LOCATION_CLICKED', 'EVENT_TRIGGERED', 1);
    modalRef.result
      .then(() => {
        this.locationChecked = false;
      })
      .catch(() => {
        this.locationChecked = false;
      });
  }

  // Open add/edit address modal
  openAddressModal(address?: SavedAddress): void {
    if (address) {
      this.isEditingAddress = true;
      this.editingAddressId = address.id;
      this.addressForm = { ...address };
    } else {
      this.isEditingAddress = false;
      this.editingAddressId = null;
      this.addressForm = {
        type: 'home',
        isDefault: false,
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: '',
        name: '',
        recipientName: '',
        phone: ''
      };
    }

    this.modalService.open(this.addressModal, {
      size: 'md',
      centered: true,
      backdrop: 'static'
    });
  }



  // Use current location
  async useCurrentLocation(modal: any, radius: number = 1): Promise<void> {
  if (!this.isBrowser) return;

  try {
    const permissionState = await this.locationService.checkLocationPermission();

    if (permissionState === 'denied') {
      this.showPermissionDeniedMessage();
      return;
    }

    this.isLoading = true;

    this.locationService.getUserLocation().pipe(

      switchMap(position =>
        this.locationService.getAddressFromLatLng(
          position.coords.latitude,
          position.coords.longitude,
          radius
        )
      ),

      switchMap(location => {
        if (location) {
          return this.locationService.setCurrentLocation(location);
        }
        throw new Error('Could not get address');
      })

    ).subscribe({
      next: () => {
        this.isLoading = false;
        modal.close();
        this.showSuccessMessage('Location updated successfully');

        this.shopService.setRadius(this.radius);

      },
      error: (error) => {
        this.isLoading = false;
        this.handleLocationError(error);
      }
    });

  } catch (error) {
    this.isLoading = false;
    console.error('Location error:', error);
  }
}

onRadiusChange(): void {
  if (!this.currentLocation) return;

  this.isLoading = true;

  const { latitude, longitude } = this.currentLocation;

  // Store the latest radius and location
  this.storageService.setItem('radius', this.radius.toString());
  this.storageService.setItem('latitude', latitude.toString());
  this.storageService.setItem('longitude', longitude.toString());

  // Reset stores and fetch again with new radius
  this.shopService.setRadius(this.radius);
  this.isLoading = false;
}
  // Select from search suggestions
  selectSuggestion(suggestion: LocationSuggestion): void {
    if (!suggestion.placeId) return;

    this.isLoading = true;
    this.showSuggestions = false;
    this.locationSearchControl.setValue(suggestion.description);

    this.locationService.getPlaceDetails(suggestion.placeId).pipe(
      switchMap(details => {
        if (details?.geometry?.location) {
          const lat = details.geometry.location.lat;
          const lng = details.geometry.location.lng;
          return this.locationService.getAddressFromLatLng(lat, lng);
        }
        return of(null);
      }),
      switchMap(location => {
        if (location) {
          return this.locationService.setCurrentLocation(location);
        }
        throw new Error('Could not get location details');
      })
    ).subscribe({
      next: () => {
        this.isLoading = false;
        this.modalService.dismissAll();
        this.showSuccessMessage('Location updated successfully');
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Suggestion error:', error);
        this.showErrorMessage('Failed to set location');
      }
    });
  }

  // Select saved address
  selectSavedAddress(address: SavedAddress): void {
    this.selectedAddress = address;

    // Create a current location from saved address
    const location: CurrentLocation = {
      address: `${address.addressLine1}${address.addressLine2 ? ', ' + address.addressLine2 : ''}, ${address.city}, ${address.state} - ${address.pincode}`,
      sectorName: address.city,
      addressRest: address.addressLine1,
      latitude: address.latitude || 0,
      longitude: address.longitude || 0,
      pincode: address.pincode,
      city: address.city,
      state: address.state
    };

    this.locationService.setCurrentLocation(location).subscribe({
      next: () => {
        this.modalService.dismissAll();
        this.showSuccessMessage('Address selected');
      },
      error: (error) => {
        console.error('Error selecting address:', error);
        this.showErrorMessage('Failed to select address');
      }
    });
  }

  // Save address from form
  saveAddress(): void {
    if (!this.validateAddressForm()) {
      return;
    }

    this.isSavingAddress = true;

    // Prepare address data - FIXED: Handle null case for editingAddressId
    const addressData: Partial<SavedAddress> = {
      ...this.addressForm,
    };

    // Only add id if editing or if we need to generate one
    if (this.isEditingAddress && this.editingAddressId) {
      addressData.id = this.editingAddressId;
    }

    if (this.isEditingAddress && this.editingAddressId) {
      this.locationService.updateSavedAddress(this.editingAddressId, addressData);
      this.showSuccessMessage('Address updated successfully');
    } else {
      this.locationService.addSavedAddress(addressData as Omit<SavedAddress, 'id'>);
      this.showSuccessMessage('Address saved successfully');
    }

    this.isSavingAddress = false;
    this.modalService.dismissAll();
  }

  // Delete address
  deleteAddress(addressId: string, event: Event): void {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this address?')) {
      this.locationService.deleteSavedAddress(addressId);
      this.showSuccessMessage('Address deleted successfully');
    }
  }

  // Set as default address
  setDefaultAddress(address: SavedAddress, event: Event): void {
    event.stopPropagation();
    this.locationService.updateSavedAddress(address.id, { isDefault: true });
    this.showSuccessMessage('Default address updated');
  }

  // Validate address form
  private validateAddressForm(): boolean {
    if (!this.addressForm.addressLine1 || !this.addressForm.addressLine1.trim()) {
      this.showErrorMessage('Address line 1 is required');
      return false;
    }
    if (!this.addressForm.city || !this.addressForm.city.trim()) {
      this.showErrorMessage('City is required');
      return false;
    }
    if (!this.addressForm.state || !this.addressForm.state.trim()) {
      this.showErrorMessage('State is required');
      return false;
    }
    if (!this.addressForm.pincode || !this.addressForm.pincode.trim()) {
      this.showErrorMessage('Pincode is required');
      return false;
    }
    if (!/^\d{6}$/.test(this.addressForm.pincode)) {
      this.showErrorMessage('Please enter a valid 6-digit pincode');
      return false;
    }
    return true;
  }

  // Generate unique address ID
  private generateAddressId(): string {
    return 'addr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Update display location in header
  private updateDisplayLocation(): void {
    if (this.currentLocation && this.isBrowser) {
      this.storage.setItem('selected_location', this.currentLocation.address);
      this.storage.setItem('sector_name', this.currentLocation.sectorName);
      this.storage.setItem('address_rest', this.currentLocation.addressRest);
      this.storage.setItem('latitude', this.currentLocation.latitude.toString());
      this.storage.setItem('longitude', this.currentLocation.longitude.toString());
      this.storage.setItem('postal_code', this.currentLocation.pincode);
    }
  }

  // Load saved location from storage - FIXED: Proper type handling
  private loadSavedLocation(): void {
    const savedLocation = this.storage.getItem('current_location');
    if (savedLocation && typeof savedLocation === 'object') {
      // Ensure it matches CurrentLocation interface
      const location = savedLocation as CurrentLocation;
      if (location.address && location.pincode) {
        this.currentLocation = location;
      }
    }
  }

  // Helper methods for user feedback
  private showPermissionDeniedMessage(): void {
    alert('Location access is blocked. Please enable location permission from browser settings and try again.');
  }

  private handleLocationError(error: any): void {
    if (error && error.code === error.PERMISSION_DENIED) {
      alert('Location permission denied. Please allow location access to use this feature.');
    } else {
      alert('Unable to retrieve your location. Please try again or search manually.');
    }
  }

  private showSuccessMessage(message: string): void {
    // You can replace with a toast service
    console.log('Success:', message);
    // For now, use alert for demo
    alert(message);
  }

  private showErrorMessage(message: string): void {
    // You can replace with a toast service
    console.error('Error:', message);
    // For now, use alert for demo
    alert(message);
  }

  private checkUserLocation(): void {

    // 1️⃣ Check local storage
    const storedLocation = this.storage.getItemA('current_location');

    if (storedLocation) {
      this.currentLocation = storedLocation;
      return;
    }

    // 2️⃣ If logged in → check DB
    if (this.authService.hasValidToken()) {

      this.locationService.fetchUserAddresses().subscribe({
        next: (addresses) => {

          if (addresses && addresses.length > 0) {

            const defaultAddress =
              addresses.find(a => a.isDefault) || addresses[0];

            this.selectSavedAddress(defaultAddress);

          } else {

            // 3️⃣ No address → show modal
            setTimeout(() => {
              this.openLocationModal();
            }, 500);
          }
        },
        error: () => {
          setTimeout(() => {
            this.openLocationModal();
          }, 500);
        }
      });

    } else {

      // 4️⃣ Guest user without location
      setTimeout(() => {
        this.openLocationModal();
      }, 500);
    }
  }
}