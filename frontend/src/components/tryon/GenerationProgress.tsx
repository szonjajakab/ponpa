import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, ActivityIndicator } from 'react-native';
import { TryOnStatus } from '../../services/tryon';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';

interface GenerationProgressProps {
  status: TryOnStatus;
  progress: number;
  estimatedTimeRemaining?: number | null;
  outfitName?: string;
  showDetails?: boolean;
}

export const GenerationProgress: React.FC<GenerationProgressProps> = ({
  status,
  progress,
  estimatedTimeRemaining,
  outfitName,
  showDetails = true,
}) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: progress / 100,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  useEffect(() => {
    // Pulse animation for active states
    if (status === 'pending' || status === 'in_progress') {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => pulseAnimation.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [status, pulseAnim]);

  const getStatusColor = (currentStatus: TryOnStatus): string => {
    switch (currentStatus) {
      case 'pending':
        return colors.warning;
      case 'in_progress':
        return colors.primary;
      case 'completed':
        return colors.success;
      case 'failed':
        return colors.error;
      case 'cancelled':
        return colors.textSecondary;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusIcon = (currentStatus: TryOnStatus): string => {
    switch (currentStatus) {
      case 'pending':
        return '⏳';
      case 'in_progress':
        return '🎨';
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      case 'cancelled':
        return '⛔';
      default:
        return '❓';
    }
  };

  const getStatusText = (currentStatus: TryOnStatus): string => {
    switch (currentStatus) {
      case 'pending':
        return 'Starting AI generation...';
      case 'in_progress':
        return 'Generating your virtual try-on...';
      case 'completed':
        return 'Try-on complete!';
      case 'failed':
        return 'Generation failed';
      case 'cancelled':
        return 'Generation cancelled';
      default:
        return 'Unknown status';
    }
  };

  const formatEstimatedTime = (seconds?: number | null): string => {
    if (!seconds || seconds <= 0) return '';

    if (seconds < 60) {
      return `~${seconds} seconds remaining`;
    }

    const minutes = Math.ceil(seconds / 60);
    return `~${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
  };

  const statusColor = getStatusColor(status);
  const isActive = status === 'pending' || status === 'in_progress';

  return (
    <View style={styles.container}>
      {showDetails && (
        <View style={styles.header}>
          <Animated.View
            style={[
              styles.iconContainer,
              {
                backgroundColor: statusColor + '20',
                transform: [{ scale: pulseAnim }],
              }
            ]}
          >
            <Text style={styles.statusIcon}>{getStatusIcon(status)}</Text>
          </Animated.View>

          <View style={styles.statusInfo}>
            <Text style={styles.statusText}>{getStatusText(status)}</Text>
            {outfitName && (
              <Text style={styles.outfitText}>Outfit: {outfitName}</Text>
            )}
          </View>
        </View>
      )}

      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarBackground, { backgroundColor: statusColor + '20' }]}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: statusColor,
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>

          {/* Progress text overlay */}
          <Text style={[styles.progressText, { color: statusColor }]}>
            {Math.round(progress)}%
          </Text>
        </View>

        {/* Progress details */}
        {showDetails && (
          <View style={styles.progressDetails}>
            <Text style={styles.progressLabel}>
              {progress < 30 && 'Initializing...'}
              {progress >= 30 && progress < 70 && 'Processing your outfit...'}
              {progress >= 70 && progress < 100 && 'Finalizing image...'}
              {progress >= 100 && 'Complete!'}
            </Text>

            {estimatedTimeRemaining && estimatedTimeRemaining > 0 && (
              <Text style={styles.timeRemaining}>
                {formatEstimatedTime(estimatedTimeRemaining)}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Activity indicator for active states */}
      {isActive && (
        <View style={styles.activityContainer}>
          <ActivityIndicator
            size="small"
            color={statusColor}
            style={styles.activityIndicator}
          />
          <Text style={[styles.activityText, { color: statusColor }]}>
            {status === 'pending' ? 'Connecting to AI...' : 'AI is working...'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = {
  container: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.lg,
    marginVertical: dimensions.spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: dimensions.spacing.lg,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: dimensions.spacing.md,
  },
  statusIcon: {
    fontSize: 20,
  },
  statusInfo: {
    flex: 1,
  },
  statusText: {
    fontSize: dimensions.fontSize.md,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  outfitText: {
    fontSize: dimensions.fontSize.sm,
    color: colors.textSecondary,
  },
  progressSection: {
    marginBottom: dimensions.spacing.md,
  },
  progressBarContainer: {
    position: 'relative' as const,
    marginBottom: dimensions.spacing.sm,
  },
  progressBarBackground: {
    height: 24,
    borderRadius: 12,
    overflow: 'hidden' as const,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 12,
    minWidth: 24, // Ensure some width for very low percentages
  },
  progressText: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center' as const,
    fontSize: dimensions.fontSize.sm,
    fontWeight: '700' as const,
    lineHeight: 24,
  },
  progressDetails: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  progressLabel: {
    fontSize: dimensions.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500' as const,
  },
  timeRemaining: {
    fontSize: dimensions.fontSize.xs,
    color: colors.textSecondary,
    fontStyle: 'italic' as const,
  },
  activityContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingTop: dimensions.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  activityIndicator: {
    marginRight: dimensions.spacing.sm,
  },
  activityText: {
    fontSize: dimensions.fontSize.sm,
    fontWeight: '500' as const,
  },
};

// Compact version for smaller spaces
export const CompactGenerationProgress: React.FC<{
  status: TryOnStatus;
  progress: number;
}> = ({ status, progress }) => {
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress / 100,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  const statusColor = status === 'completed' ? colors.success :
                     status === 'failed' ? colors.error :
                     colors.primary;

  return (
    <View style={compactStyles.container}>
      <View style={compactStyles.progressBarBackground}>
        <Animated.View
          style={[
            compactStyles.progressBarFill,
            {
              backgroundColor: statusColor,
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      <Text style={[compactStyles.progressText, { color: statusColor }]}>
        {Math.round(progress)}%
      </Text>
    </View>
  );
};

const compactStyles = {
  container: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: dimensions.spacing.xs,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: colors.gray200,
    borderRadius: 4,
    marginRight: dimensions.spacing.sm,
    overflow: 'hidden' as const,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    minWidth: 8,
  },
  progressText: {
    fontSize: dimensions.fontSize.xs,
    fontWeight: '600' as const,
    minWidth: 35,
    textAlign: 'right' as const,
  },
};