export const API_BASE_URL = 'http://localhost:8100';
// export const API_BASE_URL = 'https://api.vamsmechatronica.in';

export const API_ENDPOINTS = {
  CATEGORIES: `${API_BASE_URL}/api/v1/categories/?page_size=20`,
  PRODUCTS: `${API_BASE_URL}/api/v1/products/`,
  GET_SUBSCRIBE: `${API_BASE_URL}/api/v1/subscriptions/`,
  POST_SUBSCRIBE: `${API_BASE_URL}/api/v1/subscriptions/create/`,

  // Auth
  GET_LOGIN_OTP: `${API_BASE_URL}/api/v1/login/request-otp`,
  VERIFY_OTP: `${API_BASE_URL}/api/v1/login/verify-otp`,

  // Cart

  GET_CART : API_BASE_URL + '/api/v1/cart/',
  ADD_TO_CART: API_BASE_URL + '/api/v1/cart/add/',
  UPDATE_CART_ITEM: API_BASE_URL + '/api/v1/cart/update/',
  DELETE_CART_ITEM: API_BASE_URL + '/api/v1/cart/delete',

  // Subscription
  GET_SUBSCRIPTION: API_BASE_URL + '/api/v1/subscriptions/',
  UPDATE_SUBSCRIPTION: API_BASE_URL + '/api/v1/subscriptions/',
  PATCH_SUBSCRIPTION: API_BASE_URL + '/api/v1/subscriptions/',
  DELETE_SUBSCRIPTION: API_BASE_URL + '/api/v1/subscriptions/',
  ADD_SUBSCRIPTION: API_BASE_URL + '/api/v1/subscriptions/create/',
};
 