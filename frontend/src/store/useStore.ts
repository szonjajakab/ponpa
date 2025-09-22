import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { User, AuthState, AppSettings } from '../types';
import { authService } from '../services/auth';

// Secure storage for Zustand persistence
const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(name);
    } catch (error) {
      console.error('Error getting item from secure storage:', error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(name, value);
    } catch (error) {
      console.error('Error setting item in secure storage:', error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch (error) {
      console.error('Error removing item from secure storage:', error);
    }
  },
};

// Auth store interface
interface AuthStore extends AuthState {
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<User>;
  register: (data: any) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<User>;
  clearError: () => void;
  initializeAuth: () => Promise<void>;
}

// Settings store interface
interface SettingsStore {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

// Default settings
const defaultSettings: AppSettings = {
  theme: 'system',
  language: 'en',
  notifications: {
    push: true,
    email: true,
    wearReminders: true,
    outfitSuggestions: true,
  },
  privacy: {
    shareAnalytics: false,
    publicProfile: false,
  },
};

// Auth store
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,

      // Actions
      setUser: (user) => {
        set({
          user,
          isAuthenticated: user !== null,
          error: null
        });
      },

      setLoading: (isLoading) => {
        set({ isLoading });
      },

      setError: (error) => {
        set({ error, isLoading: false });
      },

      clearError: () => {
        set({ error: null });
      },

      login: async (email, password) => {
        try {
          set({ isLoading: true, error: null });
          const user = await authService.login({ email, password });
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
          return user;
        } catch (error: any) {
          set({
            error: error.message || 'Login failed',
            isLoading: false
          });
          throw error;
        }
      },

      register: async (data) => {
        try {
          set({ isLoading: true, error: null });
          const user = await authService.register(data);
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
          return user;
        } catch (error: any) {
          set({
            error: error.message || 'Registration failed',
            isLoading: false
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true });
          await authService.logout();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        } catch (error: any) {
          set({
            error: error.message || 'Logout failed',
            isLoading: false
          });
          throw error;
        }
      },

      updateProfile: async (updates) => {
        try {
          set({ isLoading: true, error: null });
          const updatedUser = await authService.updateProfile(updates);
          set({
            user: updatedUser,
            isLoading: false,
            error: null
          });
          return updatedUser;
        } catch (error: any) {
          set({
            error: error.message || 'Profile update failed',
            isLoading: false
          });
          throw error;
        }
      },

      initializeAuth: async () => {
        try {
          set({ isLoading: true });
          const user = await authService.initializeAuth();
          set({
            user,
            isAuthenticated: user !== null,
            isLoading: false,
            error: null
          });
        } catch (error: any) {
          set({
            error: error.message || 'Auth initialization failed',
            isLoading: false
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);

// Settings store
export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,

      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));
      },

      resetSettings: () => {
        set({ settings: defaultSettings });
      },
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);

// Wardrobe store interface (for future use)
interface WardrobeStore {
  clothingItems: any[];
  outfits: any[];
  isLoading: boolean;
  error: string | null;
  // Actions will be added when implementing wardrobe features
}

// Wardrobe store (basic structure for future implementation)
export const useWardrobeStore = create<WardrobeStore>()((set) => ({
  clothingItems: [],
  outfits: [],
  isLoading: false,
  error: null,
}));

// Export individual hooks for convenience
export const useAuth = () => {
  const store = useAuthStore();
  return {
    ...store,
    isLoading: store.isLoading,
    error: store.error,
  };
};

export const useSettings = () => useSettingsStore();
export const useWardrobe = () => useWardrobeStore();

// Initialize auth state on app start
export const initializeApp = async () => {
  const { initializeAuth } = useAuthStore.getState();
  await initializeAuth();

  // Set up auth state listener
  authService.onAuthStateChanged((user) => {
    const { setUser } = useAuthStore.getState();
    setUser(user);
  });
};