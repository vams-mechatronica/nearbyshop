export interface UserInfo {
  id: number;
  username: string;
  email: string;
  phone_number: string;
  role: 'customer' | 'vendor' | 'bda' | string; // tighten if you know all roles
  is_phone_verified: boolean;
  is_email_verified: boolean;
  customerprofile: any | null;  // replace `any` with proper type if known
  vendorprofile: any | null;    // same here
  bdaprofile: any | null;       // same here
}

export interface UserProfileUpdateResponse {
  username: string;
  email: string;
}


export interface AddDeliveryAddress {
  name: string;
  address_line: string;
  city: string;
  state: string | null;
  zip_code: string;
  phone_number: string;
}
