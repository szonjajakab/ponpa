// User types
export interface User {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  dateOfBirth?: Date;
  bio?: string;
  website?: string;
  createdAt: Date;
  updatedAt: Date;
  emailVerified: boolean;
}

// Auth types
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
}

// API types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: Record<string, any>;
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
};

export type MainStackParamList = {
  TabNavigator: undefined;
  Home: undefined;
  Profile: undefined;
  Wardrobe: undefined;
  Outfits: undefined;
  Analytics: undefined;
  TryOn: undefined;
  AddItem: undefined;
  ItemDetails: { itemId: string };
  EditItem: { itemId: string };
  CreateOutfit: undefined;
  OutfitDetails: { outfitId: string };
  EditOutfit: { outfitId: string };
};

// Component props
export interface BaseProps {
  testID?: string;
}

export interface FormFieldProps extends BaseProps {
  label?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

// Loading states
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// Common utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type ID = string;

// Form state types
export interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
}

// Image types
export interface ImageAsset {
  uri: string;
  type?: string;
  name?: string;
  size?: number;
}

// Storage keys
export enum StorageKeys {
  AUTH_TOKEN = 'auth_token',
  REFRESH_TOKEN = 'refresh_token',
  USER_DATA = 'user_data',
  SETTINGS = 'settings',
  ONBOARDING_COMPLETED = 'onboarding_completed',
}

// Theme types
export interface Theme {
  colors: Record<string, string>;
  spacing: Record<string, number>;
  typography: Record<string, any>;
  borderRadius: Record<string, number>;
}

// App settings
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    push: boolean;
    email: boolean;
    wearReminders: boolean;
    outfitSuggestions: boolean;
  };
  privacy: {
    shareAnalytics: boolean;
    publicProfile: boolean;
  };
}

// Wardrobe types
export enum ClothingCategory {
  TOPS = 'tops',
  BOTTOMS = 'bottoms',
  DRESSES = 'dresses',
  OUTERWEAR = 'outerwear',
  SHOES = 'shoes',
  ACCESSORIES = 'accessories',
  UNDERWEAR = 'underwear',
  ACTIVEWEAR = 'activewear',
  FORMAL = 'formal',
  CASUAL = 'casual',
}

export enum ClothingSize {
  XS = 'XS',
  S = 'S',
  M = 'M',
  L = 'L',
  XL = 'XL',
  XXL = 'XXL',
  XXXL = 'XXXL',
  SIZE_0 = '0',
  SIZE_2 = '2',
  SIZE_4 = '4',
  SIZE_6 = '6',
  SIZE_8 = '8',
  SIZE_10 = '10',
  SIZE_12 = '12',
  SIZE_14 = '14',
  SIZE_16 = '16',
  SIZE_18 = '18',
  SIZE_20 = '20',
}

export interface Color {
  name: string;
  hex_code?: string;
}

export interface ClothingItem {
  id: string;
  user_uid: string;
  name: string;
  category: ClothingCategory;
  brand?: string;
  size?: ClothingSize;
  colors: Color[];
  description?: string;
  image_urls: string[];
  purchase_date?: Date;
  purchase_price?: number;
  tags: string[];
  is_favorite: boolean;
  wear_count: number;
  last_worn?: Date;
  condition?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ClothingItemCreate {
  name: string;
  category: ClothingCategory;
  brand?: string;
  size?: ClothingSize;
  colors: Color[];
  description?: string;
  purchase_date?: Date;
  purchase_price?: number;
  tags: string[];
  condition?: string;
  notes?: string;
}

export interface ClothingItemUpdate {
  name?: string;
  category?: ClothingCategory;
  brand?: string;
  size?: ClothingSize;
  colors?: Color[];
  description?: string;
  purchase_date?: Date;
  purchase_price?: number;
  tags?: string[];
  is_favorite?: boolean;
  condition?: string;
  notes?: string;
}

export interface Outfit {
  id: string;
  user_uid: string;
  name: string;
  description?: string;
  clothing_item_ids: string[];
  tags: string[];
  occasion?: string;
  season?: string;
  weather?: string;
  image_url?: string;
  is_favorite: boolean;
  wear_count: number;
  last_worn?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface OutfitCreate {
  name: string;
  description?: string;
  clothing_item_ids: string[];
  tags: string[];
  occasion?: string;
  season?: string;
  weather?: string;
}

export interface OutfitUpdate {
  name?: string;
  description?: string;
  clothing_item_ids?: string[];
  tags?: string[];
  occasion?: string;
  season?: string;
  weather?: string;
  is_favorite?: boolean;
}

// Filter types
export interface ClothingItemFilters {
  category?: ClothingCategory;
  size?: ClothingSize;
  brand?: string;
  is_favorite?: boolean;
  tags?: string[];
  search?: string;
}

export interface ClothingItemSort {
  field: 'created_at' | 'updated_at' | 'name' | 'wear_count' | 'last_worn';
  direction: 'asc' | 'desc';
}

// View types
export type WardrobeViewMode = 'grid' | 'list';

// Navigation types updates
export type WardrobeStackParamList = {
  WardrobeMain: undefined;
  AddItem: undefined;
  ItemDetails: { itemId: string };
  EditItem: { itemId: string };
  FilterModal: {
    currentFilters: ClothingItemFilters;
    onApplyFilters: (filters: ClothingItemFilters) => void;
  };
};