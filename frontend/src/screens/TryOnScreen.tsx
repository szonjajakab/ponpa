import React, { useState, useCallback } from 'react';
import { View, ScrollView, Alert, SafeAreaView, StatusBar, Text, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { OutfitSelector } from '../components/tryon/OutfitSelector';
import { GenerationProgress } from '../components/tryon/GenerationProgress';
import { ResultsDisplay } from '../components/tryon/ResultsDisplay';
import { SessionHistory, CompactSessionHistory } from '../components/tryon/SessionHistory';
import { useTryOnPolling, useAIServiceStatus } from '../hooks/useTryOnPolling';
import { TryOnRequest, TryOnSessionResponse } from '../services/tryon';
import { Outfit } from '../types';
import { colors } from '../constants/colors';
import { dimensions } from '../constants/dimensions';

type TryOnScreenMode = 'selection' | 'generation' | 'results' | 'history';

export const TryOnScreen: React.FC = () => {
  const [mode, setMode] = useState<TryOnScreenMode>('selection');
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [currentSession, setCurrentSession] = useState<TryOnSessionResponse | null>(null);

  const {
    session,
    isGenerating,
    isLoading,
    error,
    progress,
    estimatedTimeRemaining,
    startGeneration,
    stopPolling,
    resetState,
    retryGeneration,
  } = useTryOnPolling();

  const { status: aiStatus, isLoading: aiStatusLoading } = useAIServiceStatus();

  // Update current session when polling session changes
  React.useEffect(() => {
    if (session) {
      setCurrentSession(session);

      if (session.status === 'completed' || session.status === 'failed') {
        setMode('results');
      }
    }
  }, [session]);

  // Reset state when screen is focused
  useFocusEffect(
    useCallback(() => {
      return () => {
        // Optional: Stop polling when screen loses focus
        // stopPolling();
      };
    }, [])
  );

  const handleOutfitSelect = (outfit: Outfit) => {
    setSelectedOutfit(outfit);
  };

  const handleStartGeneration = async () => {
    if (!selectedOutfit) {
      Alert.alert('No Outfit Selected', 'Please select an outfit first.');
      return;
    }

    if (!aiStatus.available) {
      Alert.alert(
        'AI Service Unavailable',
        'The virtual try-on service is currently unavailable. Please try again later.'
      );
      return;
    }

    const request: TryOnRequest = {
      outfit_id: selectedOutfit.id,
      user_context: {
        occasion: selectedOutfit.occasion,
        style: selectedOutfit.tags?.[0],
      },
      generate_description: true,
      analyze_compatibility: true,
    };

    try {
      setMode('generation');
      await startGeneration(request);
    } catch (err) {
      console.error('Error starting generation:', err);
      Alert.alert('Error', 'Failed to start try-on generation. Please try again.');
      setMode('selection');
    }
  };

  const handleCancelGeneration = () => {
    Alert.alert(
      'Cancel Generation',
      'Are you sure you want to cancel the try-on generation?',
      [
        { text: 'Keep Generating', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => {
            stopPolling();
            resetState();
            setMode('selection');
          },
        },
      ]
    );
  };

  const handleRetryGeneration = async () => {
    try {
      setMode('generation');
      await retryGeneration();
    } catch (err) {
      console.error('Error retrying generation:', err);
      Alert.alert('Error', 'Failed to retry generation. Please try again.');
      setMode('selection');
    }
  };

  const handleSaveResult = () => {
    // TODO: Implement saving the result to user's favorites/collection
    Alert.alert('Feature Coming Soon', 'Saving results will be available in a future update.');
  };

  const handleCloseResults = () => {
    resetState();
    setMode('selection');
    setCurrentSession(null);
  };

  const handleSessionSelect = (session: TryOnSessionResponse) => {
    setCurrentSession(session);
    setMode('results');
  };

  const handleViewHistory = () => {
    setMode('history');
  };

  const handleBackToSelection = () => {
    setMode('selection');
    setCurrentSession(null);
  };

  const renderSelectionMode = () => (
    <>
      <OutfitSelector
        selectedOutfit={selectedOutfit}
        onOutfitSelect={handleOutfitSelect}
        disabled={isLoading || isGenerating}
      />

      {selectedOutfit && (
        <View style={styles.actionSection}>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.generateButton,
                (!aiStatus.available || aiStatusLoading) && styles.disabledButton,
              ]}
              onPress={handleStartGeneration}
              disabled={isLoading || isGenerating || !aiStatus.available || aiStatusLoading}
            >
              <Text style={[
                styles.generateButtonText,
                (!aiStatus.available || aiStatusLoading) && styles.disabledButtonText,
              ]}>
                {isLoading ? 'Starting...' : 'Generate Virtual Try-On'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.historyButton}
              onPress={handleViewHistory}
            >
              <Text style={styles.historyButtonText}>View History</Text>
            </TouchableOpacity>
          </View>

          {!aiStatus.available && (
            <Text style={styles.serviceStatusText}>
              ⚠️ AI service is currently unavailable
            </Text>
          )}
        </View>
      )}

      {/* Recent Sessions Preview */}
      <CompactSessionHistory
        onSessionSelect={handleSessionSelect}
        limit={5}
      />
    </>
  );

  const renderGenerationMode = () => (
    <View style={styles.generationContainer}>
      {selectedOutfit && (
        <GenerationProgress
          status={session?.status || 'pending'}
          progress={progress}
          estimatedTimeRemaining={estimatedTimeRemaining}
          outfitName={selectedOutfit.name}
          showDetails={true}
        />
      )}

      <View style={styles.generationActions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancelGeneration}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRetryGeneration}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderResultsMode = () => {
    if (!currentSession || !selectedOutfit) return null;

    return (
      <ResultsDisplay
        session={currentSession}
        outfit={selectedOutfit}
        onRetry={handleRetryGeneration}
        onSave={handleSaveResult}
        onClose={handleCloseResults}
        showActions={true}
      />
    );
  };

  const renderHistoryMode = () => (
    <View style={styles.historyContainer}>
      <View style={styles.historyHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackToSelection}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <SessionHistory
        onSessionSelect={handleSessionSelect}
        showDetails={true}
      />
    </View>
  );

  const renderCurrentMode = () => {
    switch (mode) {
      case 'selection':
        return renderSelectionMode();
      case 'generation':
        return renderGenerationMode();
      case 'results':
        return renderResultsMode();
      case 'history':
        return renderHistoryMode();
      default:
        return renderSelectionMode();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {mode === 'selection' || mode === 'generation' ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderCurrentMode()}
        </ScrollView>
      ) : (
        <View style={styles.fullScreenMode}>
          {renderCurrentMode()}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: dimensions.spacing.xl,
  },
  fullScreenMode: {
    flex: 1,
  },
  actionSection: {
    backgroundColor: colors.white,
    paddingHorizontal: dimensions.containerPadding.horizontal,
    paddingVertical: dimensions.spacing.lg,
    marginTop: dimensions.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButtons: {
    gap: dimensions.spacing.sm,
  },
  generateButton: {
    backgroundColor: colors.primary,
    borderRadius: dimensions.borderRadius.md,
    paddingVertical: dimensions.spacing.md,
    alignItems: 'center' as const,
  },
  generateButtonText: {
    color: colors.white,
    fontSize: dimensions.fontSize.md,
    fontWeight: '600' as const,
  },
  disabledButton: {
    backgroundColor: colors.gray200,
  },
  disabledButtonText: {
    color: colors.textSecondary,
  },
  historyButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: dimensions.borderRadius.md,
    paddingVertical: dimensions.spacing.md,
    alignItems: 'center' as const,
  },
  historyButtonText: {
    color: colors.primary,
    fontSize: dimensions.fontSize.md,
    fontWeight: '600' as const,
  },
  serviceStatusText: {
    fontSize: dimensions.fontSize.xs,
    color: colors.warning,
    textAlign: 'center' as const,
    marginTop: dimensions.spacing.sm,
    fontStyle: 'italic' as const,
  },
  generationContainer: {
    flex: 1,
    paddingHorizontal: dimensions.containerPadding.horizontal,
    paddingTop: dimensions.spacing.xl,
    justifyContent: 'center' as const,
  },
  generationActions: {
    marginTop: dimensions.spacing.xl,
    alignItems: 'center' as const,
  },
  cancelButton: {
    backgroundColor: colors.error,
    borderRadius: dimensions.borderRadius.md,
    paddingHorizontal: dimensions.spacing.xl,
    paddingVertical: dimensions.spacing.md,
  },
  cancelButtonText: {
    color: colors.white,
    fontSize: dimensions.fontSize.md,
    fontWeight: '600' as const,
  },
  errorContainer: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.md,
    padding: dimensions.spacing.lg,
    marginTop: dimensions.spacing.lg,
    alignItems: 'center' as const,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorText: {
    fontSize: dimensions.fontSize.md,
    color: colors.error,
    textAlign: 'center' as const,
    marginBottom: dimensions.spacing.md,
  },
  retryButton: {
    backgroundColor: colors.warning,
    borderRadius: dimensions.borderRadius.md,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.sm,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: dimensions.fontSize.md,
    fontWeight: '600' as const,
  },
  historyContainer: {
    flex: 1,
  },
  historyHeader: {
    backgroundColor: colors.white,
    paddingHorizontal: dimensions.containerPadding.horizontal,
    paddingVertical: dimensions.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    alignSelf: 'flex-start' as const,
  },
  backButtonText: {
    fontSize: dimensions.fontSize.md,
    color: colors.primary,
    fontWeight: '600' as const,
  },
};