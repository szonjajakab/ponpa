import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { API_CONFIG, API_ENDPOINTS, HTTP_STATUS } from '../constants/api';
import {
  ClothingItem,
  ClothingItemCreate,
  ClothingItemUpdate,
  ClothingItemFilters,
  Outfit,
  OutfitCreate,
  OutfitUpdate,
  ApiResponse,
  ApiError,
} from '../types';

class ApiService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        try {
          // Get token from secure storage or auth service
          const token = await this.getAuthToken();
          if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.warn('Failed to get auth token:', error);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const apiError: ApiError = {
          message: error.message || 'An error occurred',
          status: error.response?.status || 500,
          code: error.code,
          details: error.response?.data as Record<string, any> | undefined,
        };

        // Handle specific error cases
        if (apiError.status === HTTP_STATUS.UNAUTHORIZED) {
          // Handle unauthorized access (redirect to login, refresh token, etc.)
          this.handleUnauthorized();
        }

        return Promise.reject(apiError);
      }
    );
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      // Get Firebase auth token
      const { default: auth } = await import('@react-native-firebase/auth');
      const currentUser = auth().currentUser;

      if (currentUser) {
        const token = await currentUser.getIdToken();
        return token;
      }
    } catch (error) {
      console.warn('Failed to get Firebase auth token:', error);
    }

    return null;
  }

  private handleUnauthorized() {
    // Handle unauthorized access (logout, redirect to login, etc.)
    console.warn('Unauthorized access detected');
  }

  // Clothing Items API

  async getClothingItems(
    filters?: ClothingItemFilters,
    limit?: number,
    offset?: number
  ): Promise<ClothingItem[]> {
    const params = new URLSearchParams();

    if (filters?.category) params.append('category', filters.category);
    if (filters?.size) params.append('size', filters.size);
    if (filters?.brand) params.append('brand', filters.brand);
    if (filters?.is_favorite !== undefined) params.append('is_favorite', filters.is_favorite.toString());
    if (filters?.tags?.length) params.append('tags', filters.tags.join(','));
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());

    const response: AxiosResponse<ClothingItem[]> = await this.axiosInstance.get(
      `${API_ENDPOINTS.WARDROBE.CLOTHING_ITEMS}?${params.toString()}`
    );

    return response.data.map(this.transformClothingItem);
  }

  async getClothingItem(id: string): Promise<ClothingItem> {
    const response: AxiosResponse<ClothingItem> = await this.axiosInstance.get(
      API_ENDPOINTS.WARDROBE.CLOTHING_ITEM(id)
    );

    return this.transformClothingItem(response.data);
  }

  async createClothingItem(data: ClothingItemCreate): Promise<ClothingItem> {
    const response: AxiosResponse<ClothingItem> = await this.axiosInstance.post(
      API_ENDPOINTS.WARDROBE.CLOTHING_ITEMS,
      this.transformClothingItemForApi(data)
    );

    return this.transformClothingItem(response.data);
  }

  async updateClothingItem(id: string, data: ClothingItemUpdate): Promise<ClothingItem> {
    const response: AxiosResponse<ClothingItem> = await this.axiosInstance.put(
      API_ENDPOINTS.WARDROBE.CLOTHING_ITEM(id),
      this.transformClothingItemForApi(data)
    );

    return this.transformClothingItem(response.data);
  }

  async deleteClothingItem(id: string): Promise<void> {
    await this.axiosInstance.delete(API_ENDPOINTS.WARDROBE.CLOTHING_ITEM(id));
  }

  async uploadClothingItemImages(id: string, images: File[]): Promise<string[]> {
    const formData = new FormData();
    images.forEach((image, index) => {
      formData.append('files', image);
    });

    const response: AxiosResponse<{ image_urls: string[] }> = await this.axiosInstance.post(
      API_ENDPOINTS.WARDROBE.CLOTHING_ITEM_IMAGES(id),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.image_urls;
  }

  async deleteClothingItemImages(id: string, imageUrls: string[]): Promise<void> {
    await this.axiosInstance.delete(API_ENDPOINTS.WARDROBE.CLOTHING_ITEM_IMAGES(id), {
      data: { image_urls: imageUrls },
    });
  }

  async recordClothingItemWear(id: string): Promise<ClothingItem> {
    const response: AxiosResponse<ClothingItem> = await this.axiosInstance.post(
      API_ENDPOINTS.WARDROBE.CLOTHING_ITEM_WEAR(id)
    );

    return this.transformClothingItem(response.data);
  }

  // Outfits API

  async getOutfits(
    filters?: { occasion?: string; season?: string; weather?: string; is_favorite?: boolean; tags?: string[] },
    limit?: number,
    offset?: number
  ): Promise<Outfit[]> {
    const params = new URLSearchParams();

    if (filters?.occasion) params.append('occasion', filters.occasion);
    if (filters?.season) params.append('season', filters.season);
    if (filters?.weather) params.append('weather', filters.weather);
    if (filters?.is_favorite !== undefined) params.append('is_favorite', filters.is_favorite.toString());
    if (filters?.tags?.length) params.append('tags', filters.tags.join(','));
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());

    const response: AxiosResponse<Outfit[]> = await this.axiosInstance.get(
      `${API_ENDPOINTS.WARDROBE.OUTFITS}?${params.toString()}`
    );

    return response.data.map(this.transformOutfit);
  }

  async getOutfit(id: string): Promise<Outfit> {
    const response: AxiosResponse<Outfit> = await this.axiosInstance.get(
      API_ENDPOINTS.WARDROBE.OUTFIT(id)
    );

    return this.transformOutfit(response.data);
  }

  async createOutfit(data: OutfitCreate): Promise<Outfit> {
    const response: AxiosResponse<Outfit> = await this.axiosInstance.post(
      API_ENDPOINTS.WARDROBE.OUTFITS,
      data
    );

    return this.transformOutfit(response.data);
  }

  async updateOutfit(id: string, data: OutfitUpdate): Promise<Outfit> {
    const response: AxiosResponse<Outfit> = await this.axiosInstance.put(
      API_ENDPOINTS.WARDROBE.OUTFIT(id),
      data
    );

    return this.transformOutfit(response.data);
  }

  async deleteOutfit(id: string): Promise<void> {
    await this.axiosInstance.delete(API_ENDPOINTS.WARDROBE.OUTFIT(id));
  }

  async recordOutfitWear(id: string): Promise<Outfit> {
    const response: AxiosResponse<Outfit> = await this.axiosInstance.post(
      API_ENDPOINTS.WARDROBE.OUTFIT_WEAR(id)
    );

    return this.transformOutfit(response.data);
  }

  async uploadOutfitImage(id: string, image: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', image);

    const response: AxiosResponse<{ image_url: string }> = await this.axiosInstance.post(
      API_ENDPOINTS.WARDROBE.OUTFIT_IMAGE(id),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.image_url;
  }

  async deleteOutfitImage(id: string): Promise<void> {
    await this.axiosInstance.delete(API_ENDPOINTS.WARDROBE.OUTFIT_IMAGE(id));
  }

  // Analytics API

  async getClothingAnalytics(category?: string): Promise<any> {
    const params = category ? new URLSearchParams({ category }) : '';
    const response = await this.axiosInstance.get(
      `${API_ENDPOINTS.WARDROBE.ANALYTICS.CLOTHING_ITEMS}?${params.toString()}`
    );

    return response.data;
  }

  async getOutfitAnalytics(): Promise<any> {
    const response = await this.axiosInstance.get(
      API_ENDPOINTS.WARDROBE.ANALYTICS.OUTFITS
    );

    return response.data;
  }

  // Transform functions to handle date conversion

  private transformClothingItem(item: any): ClothingItem {
    return {
      ...item,
      purchase_date: item.purchase_date ? new Date(item.purchase_date) : undefined,
      last_worn: item.last_worn ? new Date(item.last_worn) : undefined,
      created_at: new Date(item.created_at),
      updated_at: new Date(item.updated_at),
    };
  }

  private transformClothingItemForApi(item: ClothingItemCreate | ClothingItemUpdate): any {
    return {
      ...item,
      purchase_date: item.purchase_date?.toISOString(),
    };
  }

  private transformOutfit(outfit: any): Outfit {
    return {
      ...outfit,
      last_worn: outfit.last_worn ? new Date(outfit.last_worn) : undefined,
      created_at: new Date(outfit.created_at),
      updated_at: new Date(outfit.updated_at),
    };
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;