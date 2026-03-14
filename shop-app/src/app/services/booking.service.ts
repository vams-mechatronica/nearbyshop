import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  Service,
  ServiceProvider,
  TimeSlot,
  DayAvailability,
  AvailabilityResponse,
  Booking,
  BookingRequest,
  BookingResponse,
  ServiceListResponse,
  ServiceProviderListResponse,
  BookingStatus
} from '../models/booking.model';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private apiUrl = `${environment.apiUrl}/api/v1/bookings`;

  constructor(private http: HttpClient) {}

  /**
   * Get all services offered by a shop
   */
  getShopServices(shopSlug: string): Observable<ServiceListResponse> {
    return this.http.get<ServiceListResponse>(`${this.apiUrl}/shops/${shopSlug}/services/`);
  }

  /**
   * Get all service providers (staff) for a shop
   */
  getServiceProviders(shopSlug: string): Observable<ServiceProviderListResponse> {
    return this.http.get<ServiceProviderListResponse>(`${this.apiUrl}/shops/${shopSlug}/providers/`);
  }

  /**
   * Get availability for booking
   * Can filter by provider and/or service
   */
  getAvailability(
    shopSlug: string, 
    serviceId?: number, 
    providerId?: number, 
    startDate?: string,
    endDate?: string
  ): Observable<AvailabilityResponse> {
    let params = new HttpParams();
    
    if (serviceId) {
      params = params.set('service_id', serviceId.toString());
    }
    if (providerId) {
      params = params.set('provider_id', providerId.toString());
    }
    if (startDate) {
      params = params.set('start_date', startDate);
    }
    if (endDate) {
      params = params.set('end_date', endDate);
    }

    return this.http.get<AvailabilityResponse>(
      `${this.apiUrl}/shops/${shopSlug}/availability/`,
      { params }
    );
  }

  /**
   * Get time slots for a specific date
   */
  getTimeSlots(
    shopSlug: string, 
    date: string, 
    serviceId?: number, 
    providerId?: number
  ): Observable<TimeSlot[]> {
    let params = new HttpParams().set('date', date);
    
    if (serviceId) {
      params = params.set('service_id', serviceId.toString());
    }
    if (providerId) {
      params = params.set('provider_id', providerId.toString());
    }

    return this.http.get<{ slots: TimeSlot[] }>(
      `${this.apiUrl}/shops/${shopSlug}/slots/`,
      { params }
    ).pipe(map(response => response.slots));
  }

  /**
   * Create a new booking
   */
  createBooking(bookingData: BookingRequest): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(`${this.apiUrl}/create/`, bookingData);
  }

  /**
   * Get user's bookings
   */
  getUserBookings(status?: BookingStatus): Observable<Booking[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<{ bookings: Booking[] }>(`${this.apiUrl}/my-bookings/`, { params })
      .pipe(map(response => response.bookings));
  }

  /**
   * Get booking details by ID
   */
  getBookingById(bookingId: number): Observable<Booking> {
    return this.http.get<Booking>(`${this.apiUrl}/${bookingId}/`);
  }

  /**
   * Cancel a booking
   */
  cancelBooking(bookingId: number, reason?: string): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(`${this.apiUrl}/${bookingId}/cancel/`, { reason });
  }

  /**
   * Reschedule a booking
   */
  rescheduleBooking(
    bookingId: number, 
    newDate: string, 
    newTimeSlot: string
  ): Observable<BookingResponse> {
    return this.http.post<BookingResponse>(`${this.apiUrl}/${bookingId}/reschedule/`, {
      booking_date: newDate,
      time_slot: newTimeSlot
    });
  }

  /**
   * Get providers available for a specific service
   */
  getProvidersForService(shopSlug: string, serviceId: number): Observable<ServiceProvider[]> {
    return this.http.get<{ providers: ServiceProvider[] }>(
      `${this.apiUrl}/shops/${shopSlug}/services/${serviceId}/providers/`
    ).pipe(map(response => response.providers));
  }

  /**
   * Generate mock time slots for development
   */
  generateMockTimeSlots(date: string, startHour: number = 9, endHour: number = 18): TimeSlot[] {
    const slots: TimeSlot[] = [];
    for (let hour = startHour; hour < endHour; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const startTime = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        const endMin = min + 30;
        const endHr = endMin >= 60 ? hour + 1 : hour;
        const endTime = `${endHr.toString().padStart(2, '0')}:${(endMin % 60).toString().padStart(2, '0')}`;
        
        slots.push({
          id: `${date}-${startTime}`,
          start_time: startTime,
          end_time: endTime,
          is_available: Math.random() > 0.3 // 70% available for demo
        });
      }
    }
    return slots;
  }

  /**
   * Generate mock availability for next N days
   */
  generateMockAvailability(days: number = 7): DayAvailability[] {
    const availability: DayAvailability[] = [];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();
      
      availability.push({
        date: dateStr,
        day_name: dayNames[dayOfWeek],
        is_open: dayOfWeek !== 0, // Closed on Sundays
        slots: dayOfWeek !== 0 ? this.generateMockTimeSlots(dateStr) : []
      });
    }
    
    return availability;
  }
}
