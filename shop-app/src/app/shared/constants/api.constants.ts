export const API_BASE_URL = 'http://localhost:8000';
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
  UPDATE_SUBSCRIPTION: API_BASE_URL + '/api/v1/subscriptions',
  PATCH_SUBSCRIPTION: API_BASE_URL + '/api/v1/subscriptions/',
  DELETE_SUBSCRIPTION: API_BASE_URL + '/api/v1/subscriptions/',
  ADD_SUBSCRIPTION: API_BASE_URL + '/api/v1/subscriptions/create/',

  //
  GET_BANNERS: API_BASE_URL + '/api/v1/banners/',

  // User Related
  GET_USERINFO: API_BASE_URL + '/api/v1/user/',
  GET_USERADDRESS: API_BASE_URL + '/api/v1/user/addresses/',
  ADD_USERADDRESS: API_BASE_URL + '/api/v1/user/addresses/',
  GET_USERWALLET: API_BASE_URL + '/api/v1/wallet/balance/',

  // Waller
  CREATE_WALLET_RECHARGE_RAZORPAY_ORDER: API_BASE_URL + '/api/v1/wallet/recharge/initiate/',
  VERIFY_WALLET_RECHARGE_RAZORPAY_ORDER: API_BASE_URL + '/api/v1/wallet/recharge/verify/',

  // Cart Checkout Payment
  CREATE_CART_PAYMENT_RAZORPAY_ORDER: API_BASE_URL + '/api/v1/payment/initiate/?order_id=',
  VERIFY_CART_PAYMENT_RAZORPAY_ORDER: API_BASE_URL + '/api/v1/payment/verify/',

  // Create Order 
  CREATE_ORDER: API_BASE_URL + '/api/v1/orders/create/',

};
 