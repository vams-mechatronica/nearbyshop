export const API_BASE_URL = 'http://localhost:8000';

export const API_ENDPOINTS = {
  CATEGORIES: `${API_BASE_URL}/api/v1/categories/`,
  PRODUCTS: `${API_BASE_URL}/api/v1/products/`,
  GET_SUBSCRIBE: `${API_BASE_URL}/api/v1/subscriptions/`,
  POST_SUBSCRIBE: `${API_BASE_URL}/api/v1/subscriptions/create/`,

  // Auth
  GET_LOGIN_OTP: `${API_BASE_URL}/api/v1/login/request-otp`,
  VERIFY_OTP: `${API_BASE_URL}/api/v1/login/verify-otp`,
};
