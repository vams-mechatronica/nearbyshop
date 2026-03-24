// booking.model.ts

import { UUID } from "node:crypto";

export interface ServiceProvider {
  id: number;
  name: string;
  profile_image: string;
  role: string;
  specializations: string[];
  rating: number;
  review_count: number;
  experience_years: number;
  is_available: boolean;
}

export interface Service {
  id: number;
  name: string;
  description: string;
  base_price: number;
  estimated_duration_minutes: number;
  category: string;
  image?: string;
  is_active: boolean;
}

export interface TimeSlot {
  id: string;
  start_time: string;  // "09:00"
  end_time: string;    // "09:30"
  is_available: boolean;
  provider_id?: number;
}

export interface DayAvailability {
  date: string;  // "2026-03-10"
  day_name: string;
  is_open: boolean;
  slots: TimeSlot[];
}

export interface AvailabilityResponse {
  shop_id: number;
  provider_id?: number;
  service_id?: number;
  availability: DayAvailability[];
}

export interface BookingRequest {
  shop: number;
  service: string;
  provider_id?: number;
  booking_date: string;  // "2026-03-10"
  time_slot: string;     // "09:00"
  customer_notes?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
}

export interface Booking {
  id: number;
  booking_number: string;
  shop_id: number;
  shop_name: string;
  service: Service;
  provider?: ServiceProvider;
  booking_date: string;
  time_slot: string;
  end_time: string;
  status: BookingStatus;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  customer_notes?: string;
  total_amount: number;
  payment_status: PaymentStatus;
  created_at: string;
  updated_at: string;
}

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  REFUNDED = 'refunded',
  FAILED = 'failed'
}

export interface BookingResponse {
  success: boolean;
  message: string;
  booking?: Booking;
}

export interface ServiceProviderListResponse {
  shop_id: number;
  providers: ServiceProvider[];
  total: number;
}

export interface ServiceListResponse {
  id: UUID;
  vendor: number;
  name: string;
  slug: string;
  short_description: string;
  base_price: number;
  estimated_duration_minutes: number;
  category: number;
  category_name: string;
  image?: string;
  is_active: boolean;
}
