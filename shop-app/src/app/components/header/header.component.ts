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
import { FormsModule } from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AuthComponent } from '../auth/auth.component';
import { UserService } from '../../services/user.service';
import {
  BehaviorSubject,
  Observable,
  Subject,
  debounceTime,
  distinctUntilChanged,
  switchMap,
} from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { API_ENDPOINTS } from '../../shared/constants/api.constants';
import { StorageService } from '../../services/storage.service';
import { HeaderCountService } from '../../services/header.service';
import { LoaderService } from '../../services/loader.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  imports: [CommonModule, FormsModule, RouterLink],
})
export class HeaderComponent implements OnInit {
  searchQuery = '';
  searchResults: any[] = []; // live search results
  searchSubject = new Subject<string>(); // input stream
  locationSearch = '';
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
  
  constructor(
    private router: Router,
    private modalService: NgbModal,
    private userService: UserService,
    private storage: StorageService,
    private http: HttpClient, // for search API calls
    private headerService: HeaderCountService,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }
  
  onLocationChange(event: any): void {
    const selectedId = event.target.value;
    console.log('Selected location ID:', selectedId);
    this.storage.setItem('selected_location_id', selectedId);
  }
  
  loader = inject(LoaderService);
  
  
  onNavClick(): void {
    this.loader.show();
  }
  ngOnInit(): void {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.isLoggedIn$ = this.authService.isLoggedIn$;
    if (!this.authService.hasValidToken()) {
      this.authService.logout();
    }

    this.selectedLocation = this.storage.getItem('selected_location_id');
    this.selectedLocationName = this.storage.getItem('selected_location');
    this.sectorName = this.storage.getItem('sector_name');
    this.addressRest = this.storage.getItem('address_rest');

    this.headerService.counts$.subscribe((counts) => {
      this.cartCount = counts.cart_count;
      this.subscriptionCount = counts.subscription_count;
    });

    this.headerService.fetchCounts();

    // 🔹 setup live search stream
    this.searchSubject
      .pipe(
        debounceTime(300), // wait 300ms after typing
        distinctUntilChanged(), // only trigger if query changes
        switchMap(
          (query: string) =>
            this.http.get<any[]>(`${API_ENDPOINTS.SEARCH}${query}`) // call your backend API
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
  }

  getUserInfo() {
    this.userService.getUserInfo().subscribe({
      next: (res) => {
        this.userName = res.username;
        // this.showProfileDropdown = true;
      },
      error: (err) => console.error(err),
    });
  }

  loginSignup(): void {
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
    // Example: navigate to product details
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
    // this.storage.removeItem('access_token');
    this.showProfileDropdown = false;
    // this.router.navigate(['/']);
    this.authService.logout();
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-nav')) {
      this.showProfileDropdown = false;
    }
  }


  // ✅ Open Location Modal
  openLocationModal(): void {
    const modalRef = this.modalService.open(this.locationModal, {
      centered: true,
      size: 'md',
      backdrop: 'static',
    });
  }

  async useCurrentLocation(modal: any): Promise<void> {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported on this browser.');
      return;
    }

    // 🔹 STEP 1: Check permission state (Modern Browsers)
    if ((navigator as any).permissions) {
      try {
        const permission = await (navigator as any).permissions.query({
          name: 'geolocation'
        });

        if (permission.state === 'denied') {
          alert(
            'Location access is blocked.\n\nPlease enable location permission from browser settings and try again.'
          );
          return;
        }
        // If "prompt" → browser will ask
        // If "granted" → directly fetch
      } catch (err) {
        console.warn('Permission API not supported, continuing...');
      }
    }

    // 🔹 STEP 2: Request location (this triggers permission popup)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        const apiKey = 'AIzaSyC6k0JqOh3qzhxjiWO-ua0uRYLuR7KBzRI';
        const geocodeUrl =
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;

        try {
          const response = await fetch(geocodeUrl);
          const data = await response.json();

          if (data.status !== 'OK' || !data.results.length) {
            throw new Error('No address found');
          }

          const result = data.results[0];

          let postalCode = '';
          let locality = '';
          let sector = '';
          const formattedAddress = result.formatted_address;

          result.address_components.forEach((component: any) => {
            if (component.types.includes('postal_code')) {
              postalCode = component.long_name;
            }
            if (
              component.types.includes('sublocality_level_1') ||
              component.types.includes('sublocality')
            ) {
              sector = component.long_name;
            }
            if (component.types.includes('locality')) {
              locality = component.long_name;
            }
          });

          if (!sector && locality) sector = locality;

          const addressRest = formattedAddress
            .replace(sector, '')
            .replace(/^,/, '')
            .trim();

          // ✅ Store
          this.storage.setItem('selected_location', formattedAddress);
          this.storage.setItem('sector_name', sector);
          this.storage.setItem('address_rest', addressRest);
          this.storage.setItem('latitude', lat.toString());
          this.storage.setItem('longitude', lng.toString());
          this.storage.setItem('postal_code', postalCode);
          this.storage.setItem('locality', locality);
          this.storage.setItem('selected_location_id', postalCode);

          // ✅ Update UI
          this.selectedLocationName = formattedAddress;
          this.sectorName = sector;
          this.addressRest = addressRest;
          this.deliveryTime = '6 minutes';

          modal.close();
        } catch (err) {
          console.error('Location error:', err);
          alert('Unable to fetch location details.');
          modal.close();
        }
      },
      (error) => {
        console.error('Geolocation error:', error);

        if (error.code === error.PERMISSION_DENIED) {
          alert(
            'Location permission denied.\nPlease allow location access to use this feature.'
          );
        } else {
          alert('Unable to retrieve your location.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }


  // reference to modal template
  @ViewChild('locationModal') locationModal!: TemplateRef<any>;
}
