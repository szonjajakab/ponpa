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