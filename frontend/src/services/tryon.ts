import axios, { AxiosInstance } from 'axios';
import { API_CONFIG } from '../constants/api';

export interface TryOnRequest {
  outfit_id: string;
  user_context?: {
    occasion?: string;
    weather?: string;
    style?: string;
  };
  generate_description?: boolean;
  analyze_compatibility?: boolean;
}

export interface TryOnStartResponse {
  session_id: string;
  status: TryOnStatus;
  message: string;
  poll_url: string;
}

export type TryOnStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';

export interface TryOnSessionResponse {
  session_id: string;
  status: TryOnStatus;
  progress_percentage: number;
  generated_image_url?: string;
  ai_description?: string;
  error_message?: string;
  created_at: string;
  completed_at?: string;
  estimated_completion_time?: number; // seconds remaining
}

export interface TryOnSession {
  session_id: string;
  status: TryOnStatus;
  progress_percentage: number;
  generated_image_url?: string;
  ai_description?: string;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface UserSessionsResponse {
  sessions: TryOnSessionResponse[];
  total: number;
}

class TryOnService {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupAuthInterceptor();
  }

  private setupAuthInterceptor() {
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        try {
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
  }

  private async getAuthToken(): Promise<string | null> {
    try {
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

  /**
   * Start try-on image generation
   */
  async startTryOnGeneration(request: TryOnRequest): Promise<TryOnStartResponse> {
    try {
      const response = await this.axiosInstance.post<TryOnStartResponse>(
        '/api/v1/generate-try-on-image',
        request
      );
      return response.data;
    } catch (error) {
      console.error('Failed to start try-on generation:', error);
      throw new Error('Failed to start try-on generation');
    }
  }

  /**
   * Get try-on session status and results
   */
  async getTryOnStatus(sessionId: string): Promise<TryOnSessionResponse> {
    try {
      const response = await this.axiosInstance.get<TryOnSessionResponse>(
        `/api/v1/try-on-status/${sessionId}`
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to get try-on status for ${sessionId}:`, error);
      throw new Error('Failed to get try-on status');
    }
  }

  /**
   * Get user's try-on session history
   */
  async getUserSessions(limit: number = 20): Promise<UserSessionsResponse> {
    try {
      const response = await this.axiosInstance.get<UserSessionsResponse>(
        `/api/v1/my-try-on-sessions?limit=${limit}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get user sessions:', error);
      throw new Error('Failed to get session history');
    }
  }

  /**
   * Delete a try-on session
   */
  async deleteSession(sessionId: string): Promise<{ message: string }> {
    try {
      const response = await this.axiosInstance.delete<{ message: string }>(
        `/api/v1/try-on-session/${sessionId}`
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to delete session ${sessionId}:`, error);
      throw new Error('Failed to delete session');
    }
  }

  /**
   * Check if AI service is available
   */
  async checkAIServiceStatus(): Promise<{
    available: boolean;
    model?: string;
    usage_stats_24h?: any;
    rate_limits?: any;
    error?: string;
  }> {
    try {
      const response = await this.axiosInstance.get('/api/v1/ai-service/status');
      return response.data;
    } catch (error) {
      console.error('Failed to check AI service status:', error);
      return { available: false, error: 'Service check failed' };
    }
  }

  /**
   * Poll for try-on completion with automatic retry
   */
  async pollUntilComplete(
    sessionId: string,
    onProgress?: (session: TryOnSessionResponse) => void,
    pollInterval: number = 2000,
    maxRetries: number = 150 // 5 minutes max
  ): Promise<TryOnSessionResponse> {
    let retryCount = 0;

    const poll = async (): Promise<TryOnSessionResponse> => {
      try {
        const session = await this.getTryOnStatus(sessionId);

        if (onProgress) {
          onProgress(session);
        }

        // If completed or failed, return result
        if (session.status === 'completed' || session.status === 'failed') {
          return session;
        }

        // If still in progress and under retry limit, continue polling
        if (retryCount < maxRetries && (session.status === 'pending' || session.status === 'in_progress')) {
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          return poll();
        }

        // Timeout reached
        throw new Error('Try-on generation timed out');

      } catch (error) {
        console.error('Error during polling:', error);
        throw error;
      }
    };

    return poll();
  }

  /**
   * Generate try-on with automatic polling
   */
  async generateTryOnWithPolling(
    request: TryOnRequest,
    onProgress?: (session: TryOnSessionResponse) => void
  ): Promise<TryOnSessionResponse> {
    try {
      // Start generation
      const startResponse = await this.startTryOnGeneration(request);

      // Poll until complete
      const result = await this.pollUntilComplete(
        startResponse.session_id,
        onProgress
      );

      return result;
    } catch (error) {
      console.error('Try-on generation with polling failed:', error);
      throw error;
    }
  }

  /**
   * Format estimated completion time
   */
  formatEstimatedTime(seconds?: number): string {
    if (!seconds) return 'Processing...';

    if (seconds < 60) {
      return `~${seconds} seconds remaining`;
    }

    const minutes = Math.ceil(seconds / 60);
    return `~${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
  }

  /**
   * Get status display text
   */
  getStatusDisplayText(status: TryOnStatus, progress?: number): string {
    switch (status) {
      case 'pending':
        return 'Starting AI generation...';
      case 'in_progress':
        return progress ? `Generating image... ${progress}%` : 'Generating image...';
      case 'completed':
        return 'Try-on complete!';
      case 'failed':
        return 'Generation failed';
      case 'cancelled':
        return 'Generation cancelled';
      default:
        return 'Unknown status';
    }
  }

  /**
   * Check if session is still active (processing)
   */
  isSessionActive(status: TryOnStatus): boolean {
    return status === 'pending' || status === 'in_progress';
  }

  /**
   * Check if session is complete (has results)
   */
  isSessionComplete(status: TryOnStatus): boolean {
    return status === 'completed';
  }

  /**
   * Check if session has failed
   */
  isSessionFailed(status: TryOnStatus): boolean {
    return status === 'failed' || status === 'cancelled';
  }
}

export const tryOnService = new TryOnService();