// services/location.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of, BehaviorSubject } from 'rxjs';
import { map, switchMap, catchError, tap } from 'rxjs/operators';
import { SavedAddress, CurrentLocation, DeliveryInfo, LocationSuggestion } from '../types/location.types';
import { API_ENDPOINTS } from '../shared/constants/api.constants';
import { StorageService } from './storage.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LocationService {

  // State management
  private currentLocationSubject = new BehaviorSubject<CurrentLocation | null>(null);
  currentLocation$ = this.currentLocationSubject.asObservable();

  private savedAddressesSubject = new BehaviorSubject<SavedAddress[]>([]);
  savedAddresses$ = this.savedAddressesSubject.asObservable();

  private deliveryInfoSubject = new BehaviorSubject<DeliveryInfo | null>(null);
  deliveryInfo$ = this.deliveryInfoSubject.asObservable();

  constructor(
    private http: HttpClient,
    private storage: StorageService // You'll need to create this
  ) {
    this.loadSavedAddresses();
    this.loadStoredLocation();
  }

  private loadSavedAddresses(): void {
    const addresses = this.storage.getItemA('saved_addresses') || [];
    this.savedAddressesSubject.next(addresses);
  }

  private loadStoredLocation(): void {
    const location = this.storage.getItemA('current_location');
    if (location) {
      this.currentLocationSubject.next(location);
    }
  }



  // Get user's current position
  getUserLocation(): Observable<GeolocationPosition> {
    return from(new Promise<GeolocationPosition>((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      } else {
        reject('Geolocation not supported');
      }
    }));
  }

  getAddressFromLatLng(
    lat: number,
    lng: number,
    radius?: number
  ): Observable<CurrentLocation | null> {

    const finalRadius = radius ?? 1;
    const url = `${API_ENDPOINTS.REVERSE_GEOCODE}?lat=${lat}&lng=${lng}&radius=${finalRadius}`;

    return this.http.get<any>(url).pipe(
      map(response => this.parseGeocodeResponse(response)),
      catchError(error => {
        console.error('Geocoding error:', error);
        return of(null);
      })
    );
  }

  private parseGeocodeResponse(response: any): CurrentLocation | null {
    if (!response || !response.address || !response.latitude || !response.longitude) {
      return null;
    }

    const formattedAddress = response.address;
    const lat = response.latitude;
    const lng = response.longitude;

    let postalCode = '';
    let locality = '';
    let sector = '';
    let state = '';
    let country = '';

    if (Array.isArray(response.components)) {
      response.components.forEach((component: any) => {
        if (component.types.includes('postal_code')) {
          postalCode = component.long_name;
        }
        if (component.types.includes('sublocality_level_1') || component.types.includes('sublocality')) {
          sector = component.long_name;
        }
        if (component.types.includes('locality')) {
          locality = component.long_name;
        }
        if (component.types.includes('administrative_area_level_1')) {
          state = component.long_name;
        }
        if (component.types.includes('country')) {
          country = component.long_name;
        }
      });
    }

    // Fallback: if no sector, use locality
    if (!sector && locality) sector = locality;

    const addressRest = formattedAddress
      .replace(sector, '')
      .replace(/^,/, '')
      .trim();

    return {
      address: formattedAddress,
      sectorName: sector,
      addressRest: addressRest,
      latitude: lat,
      longitude: lng,
      pincode: postalCode,
      city: locality,
      state: state
    };
  }

  // Set current location
  setCurrentLocation(location: CurrentLocation): Observable<DeliveryInfo> {
    this.currentLocationSubject.next(location);
    this.storage.setItemA('current_location', location);
    this.storage.setItemA('postal_code', location.pincode);

    // Check delivery availability
    return this.checkDeliveryAvailability(location.pincode).pipe(
      tap(deliveryInfo => {
        this.deliveryInfoSubject.next(deliveryInfo);
      })
    );
  }

  // Check delivery availability
  checkDeliveryAvailability(pincode: string): Observable<DeliveryInfo> {
    return this.http.get<any>(API_ENDPOINTS.VERIFY_PINCODE, {
      params: { pincode }
    }).pipe(
      map(response => ({
        available: response.available,
        estimatedTime: response.estimatedTime || '30-40 minutes',
        minOrder: response.minOrder,
        deliveryCharge: response.deliveryCharge,
        message: response.message
      })),
      catchError(() => of({
        available: false,
        estimatedTime: 'N/A',
        message: 'Delivery not available at this location'
      }))
    );
  }

  // Search places using Google Places API
  searchPlaces(query: string): Observable<LocationSuggestion[]> {
    if (!query || query.length < 3) {
      return of([]);
    }

    const url = `${environment.apiUrl}/api/location/place-autocomplete/?input=${encodeURIComponent(query)}`;

    return this.http.get<any>(url).pipe(
      map(res => res.predictions.map((p: any) => ({
        description: p.description,
        placeId: p.place_id,
        structured_formatting: p.structured_formatting
      }))),
      catchError(() => of([]))
    );
  }

  // Get place details from place ID
  getPlaceDetails(placeId: string): Observable<any> {
    const url = `${environment.apiUrl}/api/location/place-details/?place_id=${placeId}`;

    return this.http.get<any>(url).pipe(
      map(response => response.result),
      catchError(() => of(null))
    );
  }

  // Saved addresses management
  addSavedAddress(address: Omit<SavedAddress, 'id'>): void {
    const currentAddresses = this.savedAddressesSubject.value;
    const newAddress: SavedAddress = {
      ...address,
      id: this.generateAddressId()
    };

    if (address.isDefault) {
      // Remove default from others
      currentAddresses.forEach(addr => addr.isDefault = false);
    }

    const updatedAddresses = [...currentAddresses, newAddress];
    this.savedAddressesSubject.next(updatedAddresses);
    this.storage.setItemA('saved_addresses', updatedAddresses);
  }

  updateSavedAddress(id: string, updates: Partial<SavedAddress>): void {
    const currentAddresses = this.savedAddressesSubject.value;
    const index = currentAddresses.findIndex(addr => addr.id === id);

    if (index !== -1) {
      if (updates.isDefault) {
        // Remove default from others
        currentAddresses.forEach(addr => addr.isDefault = false);
      }

      currentAddresses[index] = { ...currentAddresses[index], ...updates };
      this.savedAddressesSubject.next([...currentAddresses]);
      this.storage.setItemA('saved_addresses', currentAddresses);
    }
  }


  getPincodeFromLatLng(lat: number, lng: number): Observable<string | null> {
    const url = `${API_ENDPOINTS.REVERSE_GEOCODE}?lat=${lat}&lng=${lng}`;
    return this.http.get<any>(url).pipe(
      map(res => {
        if (res.results && res.results.length) {
          for (const component of res.results[0].address_components) {
            if (component.types.includes('postal_code')) {
              return component.long_name;
            }
          }
        }
        return null;
      }),
      catchError(error => {
        console.error('Geocoding error:', error);
        return of(null);
      })
    );
  }





  deleteSavedAddress(id: string): void {
    const currentAddresses = this.savedAddressesSubject.value;
    const updatedAddresses = currentAddresses.filter(addr => addr.id !== id);

    // If we deleted the default, set a new default if exists
    if (currentAddresses.find(addr => addr.id === id)?.isDefault) {
      if (updatedAddresses.length > 0) {
        updatedAddresses[0].isDefault = true;
      }
    }

    this.savedAddressesSubject.next(updatedAddresses);
    this.storage.setItemA('saved_addresses', updatedAddresses);
  }

  getDefaultAddress(): SavedAddress | null {
    return this.savedAddressesSubject.value.find(addr => addr.isDefault) || null;
  }

  private generateAddressId(): string {
    return 'addr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Permission check
  async checkLocationPermission(): Promise<'granted' | 'denied' | 'prompt'> {
    if (!navigator.geolocation) {
      return 'denied';
    }

    if ((navigator as any).permissions) {
      try {
        const permission = await (navigator as any).permissions.query({
          name: 'geolocation'
        });
        return permission.state;
      } catch {
        return 'prompt';
      }
    }
    return 'prompt';
  }
  getAndValidateLocation(): Observable<any> {
    return this.getUserLocation().pipe(
      switchMap(position =>
        this.getPincodeFromLatLng(
          position.coords.latitude,
          position.coords.longitude
        )
      ),
      switchMap(pincode => {
        if (pincode) {
          return this.checkDeliveryAvailability(pincode);
        } else {
          return this.checkDeliveryAvailability('110001'); // Default pincode
        }
      }),
      catchError(error => {
        console.error('Location validation error:', error);
        return of({ available: false, error: 'Location validation failed' });
      })
    );
  }

  fetchUserAddresses(): Observable<SavedAddress[]> {

    return this.http.get<SavedAddress[]>(API_ENDPOINTS.GET_USERADDRESS).pipe(

      tap(addresses => {

        this.savedAddressesSubject.next(addresses);

        this.storage.setItemA('saved_addresses', addresses);

      }),

      catchError(() => of([]))
    );
  }
}