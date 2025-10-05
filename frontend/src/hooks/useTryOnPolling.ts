import { useState, useEffect, useCallback, useRef } from 'react';
import { tryOnService, TryOnSessionResponse, TryOnStatus, TryOnRequest } from '../services/tryon';

interface UseTryOnPollingOptions {
  pollInterval?: number; // milliseconds
  maxRetries?: number;
  autoStart?: boolean;
}

interface UseTryOnPollingState {
  session: TryOnSessionResponse | null;
  isGenerating: boolean;
  isLoading: boolean;
  error: string | null;
  progress: number;
  estimatedTimeRemaining: number | null;
}

interface UseTryOnPollingActions {
  startGeneration: (request: TryOnRequest) => Promise<void>;
  stopPolling: () => void;
  resetState: () => void;
  retryGeneration: () => Promise<void>;
}

export function useTryOnPolling(
  options: UseTryOnPollingOptions = {}
): UseTryOnPollingState & UseTryOnPollingActions {
  const {
    pollInterval = 2000,
    maxRetries = 150, // 5 minutes max
    autoStart = false,
  } = options;

  const [session, setSession] = useState<TryOnSessionResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const currentSessionIdRef = useRef<string | null>(null);
  const lastRequestRef = useRef<TryOnRequest | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
    setIsGenerating(false);
  }, []);

  const resetState = useCallback(() => {
    stopPolling();
    setSession(null);
    setIsLoading(false);
    setError(null);
    setProgress(0);
    setEstimatedTimeRemaining(null);
    retryCountRef.current = 0;
    currentSessionIdRef.current = null;
    lastRequestRef.current = null;
  }, [stopPolling]);

  const pollStatus = useCallback(async (sessionId: string) => {
    try {
      const sessionData = await tryOnService.getTryOnStatus(sessionId);
      setSession(sessionData);
      setProgress(sessionData.progress_percentage);
      setEstimatedTimeRemaining(sessionData.estimated_completion_time || null);
      setError(null);

      // Check if generation is complete
      if (tryOnService.isSessionComplete(sessionData.status)) {
        setIsGenerating(false);
        stopPolling();
        return;
      }

      // Check if generation failed
      if (tryOnService.isSessionFailed(sessionData.status)) {
        setIsGenerating(false);
        setError(sessionData.error_message || 'Generation failed');
        stopPolling();
        return;
      }

      // Continue polling if still active and under retry limit
      if (tryOnService.isSessionActive(sessionData.status) && retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        pollingRef.current = setTimeout(() => {
          pollStatus(sessionId);
        }, pollInterval);
      } else if (retryCountRef.current >= maxRetries) {
        // Timeout reached
        setIsGenerating(false);
        setError('Generation timed out. Please try again.');
        stopPolling();
      }
    } catch (err) {
      console.error('Error polling try-on status:', err);
      setError('Failed to get generation status');
      setIsGenerating(false);
      stopPolling();
    }
  }, [maxRetries, pollInterval, stopPolling]);

  const startGeneration = useCallback(async (request: TryOnRequest) => {
    try {
      setIsLoading(true);
      setError(null);
      setProgress(0);
      setEstimatedTimeRemaining(null);
      lastRequestRef.current = request;

      // Start generation
      const startResponse = await tryOnService.startTryOnGeneration(request);
      currentSessionIdRef.current = startResponse.session_id;

      setIsLoading(false);
      setIsGenerating(true);
      retryCountRef.current = 0;

      // Start polling
      pollingRef.current = setTimeout(() => {
        pollStatus(startResponse.session_id);
      }, pollInterval);

    } catch (err) {
      console.error('Error starting try-on generation:', err);
      setError('Failed to start generation');
      setIsLoading(false);
      setIsGenerating(false);
    }
  }, [pollStatus, pollInterval]);

  const retryGeneration = useCallback(async () => {
    if (lastRequestRef.current) {
      await startGeneration(lastRequestRef.current);
    } else {
      setError('No previous request to retry');
    }
  }, [startGeneration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // Auto-start if requested and request is provided
  useEffect(() => {
    if (autoStart && lastRequestRef.current && !isGenerating && !session) {
      startGeneration(lastRequestRef.current);
    }
  }, [autoStart, startGeneration, isGenerating, session]);

  return {
    // State
    session,
    isGenerating,
    isLoading,
    error,
    progress,
    estimatedTimeRemaining,

    // Actions
    startGeneration,
    stopPolling,
    resetState,
    retryGeneration,
  };
}

// Hook for managing multiple try-on sessions
export function useTryOnHistory() {
  const [sessions, setSessions] = useState<TryOnSessionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async (limit?: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await tryOnService.getUserSessions(limit);
      setSessions(response.sessions);
    } catch (err) {
      console.error('Error loading try-on history:', err);
      setError('Failed to load session history');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      await tryOnService.deleteSession(sessionId);
      setSessions(prev => prev.filter(session => session.session_id !== sessionId));
    } catch (err) {
      console.error('Error deleting session:', err);
      setError('Failed to delete session');
    }
  }, []);

  const refreshSessions = useCallback(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return {
    sessions,
    isLoading,
    error,
    loadSessions,
    deleteSession,
    refreshSessions,
  };
}

// Hook for checking AI service status
export function useAIServiceStatus() {
  const [status, setStatus] = useState<{
    available: boolean;
    model?: string;
    usage_stats_24h?: any;
    rate_limits?: any;
    error?: string;
  }>({ available: false });
  const [isLoading, setIsLoading] = useState(true);

  const checkStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const serviceStatus = await tryOnService.checkAIServiceStatus();
      setStatus(serviceStatus);
    } catch (err) {
      console.error('Error checking AI service status:', err);
      setStatus({ available: false, error: 'Service check failed' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return {
    status,
    isLoading,
    checkStatus,
  };
}