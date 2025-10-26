import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { API_ENDPOINTS } from '../shared/constants/api.constants';

@Injectable({
    providedIn: 'root'
})
export class LocationService {
    private apiKey = 'AIzaSyC6k0JqOh3qzhxjiWO-ua0uRYLuR7KBzRI';

    constructor(private http: HttpClient) { }

    getUserLocation(): Observable<GeolocationPosition> {
        return from(new Promise<GeolocationPosition>((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            } else {
                reject('Geolocation not supported');
            }
        }));
    }

    getPincodeFromLatLng(lat: number, lng: number): Observable<string | null> {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${this.apiKey}`;
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
            })
        );
    }

    checkDeliveryAvailability(pincode: string): Observable<any> {
        return this.http.get(API_ENDPOINTS.VERIFY_PINCODE, { params: { pincode } });
    }

    getUserPincode(): Observable<string | null> {
        return this.getUserLocation().pipe(
            switchMap(position => this.getPincodeFromLatLng(
                position.coords.latitude,
                position.coords.longitude
            ))
        );
    }

    getAndValidateLocation(): Observable<any> {
        return this.getUserPincode().pipe(
            switchMap(pincode => {
                if (pincode) {
                    // If pincode is null, use a default value
                    return this.checkDeliveryAvailability(pincode);
                } else {
                    return this.checkDeliveryAvailability('110001');
                }   
            })
        );
    }
}
