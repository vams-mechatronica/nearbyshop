// types/location.types.ts
export interface SavedAddress {
  id: string;
  type: 'home' | 'work' | 'other';
  name: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  label?: string;
  phone?: string;
  recipientName?: string;
}

export interface LocationSuggestion {
  description: string;
  placeId: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

export interface CurrentLocation {
  address: string;
  sectorName: string;
  addressRest: string;
  latitude: number;
  longitude: number;
  pincode: string;
  city: string;
  state: string;
}

export interface DeliveryInfo {
  available: boolean;
  estimatedTime: string;
  minOrder?: number;
  deliveryCharge?: number;
  message?: string;
}