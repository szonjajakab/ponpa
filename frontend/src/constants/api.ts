// API Configuration
export const API_CONFIG = {
  BASE_URL: __DEV__ ? 'http://localhost:8000' : 'https://your-production-api.com',
  TIMEOUT: 10000,
};

// API Endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    VERIFY_EMAIL: '/auth/verify-email',
    RESET_PASSWORD: '/auth/reset-password',
  },

  // User endpoints
  USERS: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    UPLOAD_AVATAR: '/users/profile/avatar',
  },

  // Wardrobe endpoints
  WARDROBE: {
    CLOTHING_ITEMS: '/api/v1/wardrobe/clothing-items',
    CLOTHING_ITEM: (id: string) => `/api/v1/wardrobe/clothing-items/${id}`,
    CLOTHING_ITEM_IMAGES: (id: string) => `/api/v1/wardrobe/clothing-items/${id}/images`,
    CLOTHING_ITEM_WEAR: (id: string) => `/api/v1/wardrobe/clothing-items/${id}/wear`,

    OUTFITS: '/api/v1/wardrobe/outfits',
    OUTFIT: (id: string) => `/api/v1/wardrobe/outfits/${id}`,
    OUTFIT_IMAGE: (id: string) => `/api/v1/wardrobe/outfits/${id}/image`,
    OUTFIT_WEAR: (id: string) => `/api/v1/wardrobe/outfits/${id}/wear`,

    ANALYTICS: {
      CLOTHING_ITEMS: '/api/v1/wardrobe/analytics/clothing-items',
      OUTFITS: '/api/v1/wardrobe/analytics/outfits',
    },
  },

  // Try-on endpoints
  TRYON: {
    GENERATE: '/tryon/generate',
    HISTORY: '/tryon/history',
    RESULT: (id: string) => `/tryon/result/${id}`,
  },
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Request headers
export const REQUEST_HEADERS = {
  CONTENT_TYPE: 'Content-Type',
  AUTHORIZATION: 'Authorization',
  ACCEPT: 'Accept',
} as const;

// Content types
export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM_DATA: 'multipart/form-data',
  FORM_URLENCODED: 'application/x-www-form-urlencoded',
} as const;