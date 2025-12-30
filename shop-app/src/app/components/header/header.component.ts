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
  sectorName: string | null=  null;
  addressRest: any;
  deliveryTime: string = '';

  constructor(
    private router: Router,
    private modalService: NgbModal,
    private userService: UserService,
    private storage: StorageService,
    private http: HttpClient, // for search API calls
    private headerService: HeaderCountService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  get isLoggedIn(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      return !!this.storage.getItem('access_token');
    }
    return false;
  }

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
    if (this.isLoggedIn) {
      this.getUserInfo();
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
      },
      error: (err) => console.error(err),
    });
  }

  loginSignup(): void {
    this.modalService.open(AuthComponent, { centered: true, size: 'sm' });
  }

  // 🔹 called on input change
  onSearchChange(query: string): void {
    this.searchQuery = query;
    if (query.trim().length > 1) {
      this.searchSubject.next(query);
    } else {
      this.searchResults = [];
    }
  }

  // 🔹 when user presses Enter or clicks search button
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

  toggleProfileDropdown(): void {
    this.showProfileDropdown = !this.showProfileDropdown;
  }

  userProfile(): void {
    this.router.navigate(['/profile']);
  }

  logout(): void {
    this.storage.removeItem('access_token');
    this.showProfileDropdown = false;
    this.router.navigate(['/']);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-nav') && this.showProfileDropdown) {
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

  // useCurrentLocation(modal: any): void {
  //   if (navigator.geolocation) {
  //     navigator.geolocation.getCurrentPosition(
  //       (pos) => {
  //         const lat = pos.coords.latitude;
  //         const lng = pos.coords.longitude;
  //         const apiKey = 'AIzaSyC6k0JqOh3qzhxjiWO-ua0uRYLuR7KBzRI';
  //         const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${encodeURIComponent(
  //           lat
  //         )},${encodeURIComponent(lng)}&key=${apiKey}`;

  //         fetch(geocodeUrl)
  //           .then((response) => response.json())
  //           .then((data) => {
  //             if (data.status === 'OK' && data.results.length > 0) {
  //               const result = data.results[0];
  //               const formattedAddress = result.formatted_address;
  //               let postalCode = '';
  //               let locality = '';
  //               result.address_components.forEach((component: any) => {
  //                 if (component.types.includes('postal_code')) {
  //                   postalCode = component.long_name;
  //                 }
  //                 if (component.types.includes('locality')) {
  //                   locality = component.long_name;
  //                 }
  //               });

  //               // ✅ Store in localStorage
  //               this.storage.setItem('selected_location', formattedAddress);
  //               this.storage.setItem('selected_location_id', 'current');
  //               this.storage.setItem('latitude', lat.toString());
  //               this.storage.setItem('longitude', lng.toString());
  //               this.storage.setItem('postal_code', postalCode);
  //               this.storage.setItem('locality', locality);

  //               // ✅ Display on header
  //               this.selectedLocationName =
  //                 formattedAddress || 'Current Location';
  //             } else {
  //               console.warn('No address found.');
  //             }
  //             modal.close();
  //             // ✅ Refresh or navigate to home
  //             window.location.reload(); // simplest approach
  //           })
  //           .catch((error) => {
  //             console.error('Error fetching location details:', error);
  //             modal.close();
  //           });
  //       },
  //       (error) => {
  //         console.error('Error getting location:', error);
  //         alert('Unable to retrieve your location.');
  //       }
  //     );
  //   } else {
  //     alert('Geolocation is not supported on this browser.');
  //   }
  // }

  useCurrentLocation(modal: any): void {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported on this browser.');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      const apiKey = 'AIzaSyC6k0JqOh3qzhxjiWO-ua0uRYLuR7KBzRI';
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;

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
        let formattedAddress = result.formatted_address;

        result.address_components.forEach((component: any) => {
          if (component.types.includes('postal_code')) {
            postalCode = component.long_name;
          }

          if (
            component.types.includes('sublocality_level_1') ||
            component.types.includes('sublocality')
          ) {
            sector = component.long_name; // Sector 74
          }

          if (component.types.includes('locality')) {
            locality = component.long_name;
          }
        });

        // 🔹 Fallback if sector not found
        if (!sector && locality) {
          sector = locality;
        }

        // 🔹 Prepare address rest (remove sector)
        const addressRest = formattedAddress
          .replace(sector, '')
          .replace(/^,/, '')
          .trim();

        // ✅ STORE RAW DATA
        this.storage.setItem('selected_location', formattedAddress);
        this.storage.setItem('sector_name', sector);
        this.storage.setItem('address_rest', addressRest);
        this.storage.setItem('latitude', lat.toString());
        this.storage.setItem('longitude', lng.toString());
        this.storage.setItem('postal_code', postalCode);
        this.storage.setItem('locality', locality);
        this.storage.setItem('selected_location_id', 'current');

        // ✅ UPDATE HEADER (NO RELOAD)
        this.selectedLocationName = formattedAddress;
        this.sectorName = sector;
        this.addressRest = addressRest;
        this.deliveryTime = '6 minutes'; // static or from API later

        modal.close();
      } catch (err) {
        console.error('Location error:', err);
        alert('Unable to fetch location details.');
        modal.close();
      }
    },
    (error) => {
      console.error('Geolocation error:', error);
      alert('Unable to retrieve your location.');
    }
  );
}


  // reference to modal template
  @ViewChild('locationModal') locationModal!: TemplateRef<any>;
}
