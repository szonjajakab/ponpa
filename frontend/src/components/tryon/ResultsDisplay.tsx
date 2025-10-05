import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Alert, Share, Dimensions } from 'react-native';
import { TryOnSessionResponse } from '../../services/tryon';
import { Outfit } from '../../types';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';

interface ResultsDisplayProps {
  session: TryOnSessionResponse;
  outfit: Outfit;
  onRetry?: () => void;
  onSave?: () => void;
  onClose?: () => void;
  showActions?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const imageWidth = screenWidth - (dimensions.containerPadding.horizontal * 2);

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  session,
  outfit,
  onRetry,
  onSave,
  onClose,
  showActions = true,
}) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const handleShare = async () => {
    try {
      if (session.generated_image_url) {
        await Share.share({
          message: `Check out this virtual try-on of "${outfit.name}" from Ponpa!`,
          url: session.generated_image_url,
        });
      }
    } catch (error) {
      console.error('Error sharing try-on result:', error);
      Alert.alert('Error', 'Unable to share the image. Please try again.');
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave();
      Alert.alert('Success', 'Try-on result saved to your collection!');
    }
  };

  const formatCompletionTime = (createdAt: string, completedAt?: string): string => {
    if (!completedAt) return 'Processing...';

    const created = new Date(createdAt);
    const completed = new Date(completedAt);
    const diffSeconds = Math.round((completed.getTime() - created.getTime()) / 1000);

    if (diffSeconds < 60) {
      return `Generated in ${diffSeconds} seconds`;
    }

    const minutes = Math.floor(diffSeconds / 60);
    const seconds = diffSeconds % 60;
    return `Generated in ${minutes}m ${seconds}s`;
  };

  if (session.status === 'failed') {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.errorTitle}>Generation Failed</Text>
          <Text style={styles.errorMessage}>
            {session.error_message || 'Something went wrong while generating your try-on image.'}
          </Text>

          {showActions && (
            <View style={styles.actionButtons}>
              {onRetry && (
                <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              )}
              {onClose && (
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    );
  }

  if (session.status !== 'completed' || !session.generated_image_url) {
    return (
      <View style={styles.container}>
        <View style={styles.processingContainer}>
          <Text style={styles.processingIcon}>🎨</Text>
          <Text style={styles.processingText}>Still processing...</Text>
          <Text style={styles.processingSubtext}>
            The try-on generation is still in progress
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Virtual Try-On Result</Text>
          <Text style={styles.headerSubtitle}>
            {formatCompletionTime(session.created_at, session.completed_at)}
          </Text>
        </View>

        {/* Generated Image */}
        <View style={styles.imageContainer}>
          {imageLoading && (
            <View style={[styles.imagePlaceholder, { width: imageWidth, height: imageWidth }]}>
              <Text style={styles.placeholderText}>Loading image...</Text>
            </View>
          )}

          {imageError && (
            <View style={[styles.imagePlaceholder, { width: imageWidth, height: imageWidth }]}>
              <Text style={styles.placeholderIcon}>🖼️</Text>
              <Text style={styles.placeholderText}>Unable to load image</Text>
            </View>
          )}

          <Image
            source={{ uri: session.generated_image_url }}
            style={[
              styles.generatedImage,
              { width: imageWidth, height: imageWidth },
              (imageLoading || imageError) && styles.hiddenImage,
            ]}
            onLoad={handleImageLoad}
            onError={handleImageError}
            resizeMode="cover"
          />

          {/* Outfit overlay */}
          <View style={styles.imageOverlay}>
            <View style={styles.outfitInfo}>
              <Text style={styles.outfitName}>{outfit.name}</Text>
              {outfit.description && (
                <Text style={styles.outfitDescription} numberOfLines={2}>
                  {outfit.description}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* AI Description */}
        {session.ai_description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionTitle}>AI Analysis</Text>
            <Text style={styles.descriptionText}>{session.ai_description}</Text>
          </View>
        )}

        {/* Session Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Generation Details</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Session ID:</Text>
            <Text style={styles.infoValue}>{session.session_id.slice(0, 8)}...</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Created:</Text>
            <Text style={styles.infoValue}>
              {new Date(session.created_at).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status:</Text>
            <Text style={[styles.infoValue, styles.statusCompleted]}>✅ Completed</Text>
          </View>
        </View>

        {/* Action Buttons */}
        {showActions && (
          <View style={styles.actionSection}>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                <Text style={styles.shareButtonText}>Share</Text>
              </TouchableOpacity>

              {onSave && (
                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.actionRow}>
              {onRetry && (
                <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                  <Text style={styles.retryButtonText}>Generate Again</Text>
                </TouchableOpacity>
              )}

              {onClose && (
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: dimensions.containerPadding.horizontal,
    paddingVertical: dimensions.spacing.lg,
  },
  header: {
    alignItems: 'center' as const,
    marginBottom: dimensions.spacing.lg,
  },
  headerTitle: {
    fontSize: dimensions.fontSize.xl,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: dimensions.fontSize.sm,
    color: colors.textSecondary,
  },
  imageContainer: {
    position: 'relative' as const,
    alignItems: 'center' as const,
    marginBottom: dimensions.spacing.lg,
  },
  generatedImage: {
    borderRadius: dimensions.borderRadius.md,
    backgroundColor: colors.gray100,
  },
  hiddenImage: {
    opacity: 0,
    position: 'absolute' as const,
  },
  imagePlaceholder: {
    backgroundColor: colors.gray100,
    borderRadius: dimensions.borderRadius.md,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  placeholderIcon: {
    fontSize: 48,
    marginBottom: dimensions.spacing.md,
  },
  placeholderText: {
    fontSize: dimensions.fontSize.md,
    color: colors.textSecondary,
  },
  imageOverlay: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderBottomLeftRadius: dimensions.borderRadius.md,
    borderBottomRightRadius: dimensions.borderRadius.md,
    padding: dimensions.spacing.md,
  },
  outfitInfo: {
    alignItems: 'center' as const,
  },
  outfitName: {
    fontSize: dimensions.fontSize.lg,
    fontWeight: '600' as const,
    color: colors.white,
    marginBottom: 4,
  },
  outfitDescription: {
    fontSize: dimensions.fontSize.sm,
    color: colors.white + 'CC',
    textAlign: 'center' as const,
  },
  descriptionSection: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.md,
    padding: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  descriptionTitle: {
    fontSize: dimensions.fontSize.lg,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
  },
  descriptionText: {
    fontSize: dimensions.fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  infoSection: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.md,
    padding: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: dimensions.fontSize.lg,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.md,
  },
  infoRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: dimensions.spacing.xs,
  },
  infoLabel: {
    fontSize: dimensions.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500' as const,
  },
  infoValue: {
    fontSize: dimensions.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: '500' as const,
  },
  statusCompleted: {
    color: colors.success,
  },
  actionSection: {
    gap: dimensions.spacing.sm,
  },
  actionRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    gap: dimensions.spacing.sm,
  },
  shareButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: dimensions.borderRadius.md,
    paddingVertical: dimensions.spacing.md,
    alignItems: 'center' as const,
  },
  shareButtonText: {
    color: colors.white,
    fontSize: dimensions.fontSize.md,
    fontWeight: '600' as const,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.success,
    borderRadius: dimensions.borderRadius.md,
    paddingVertical: dimensions.spacing.md,
    alignItems: 'center' as const,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: dimensions.fontSize.md,
    fontWeight: '600' as const,
  },
  retryButton: {
    flex: 1,
    backgroundColor: colors.warning,
    borderRadius: dimensions.borderRadius.md,
    paddingVertical: dimensions.spacing.md,
    alignItems: 'center' as const,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: dimensions.fontSize.md,
    fontWeight: '600' as const,
  },
  closeButton: {
    flex: 1,
    backgroundColor: colors.gray200,
    borderRadius: dimensions.borderRadius.md,
    paddingVertical: dimensions.spacing.md,
    alignItems: 'center' as const,
  },
  closeButtonText: {
    color: colors.textPrimary,
    fontSize: dimensions.fontSize.md,
    fontWeight: '600' as const,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: dimensions.containerPadding.horizontal,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: dimensions.spacing.lg,
  },
  errorTitle: {
    fontSize: dimensions.fontSize.xl,
    fontWeight: '700' as const,
    color: colors.error,
    marginBottom: dimensions.spacing.sm,
    textAlign: 'center' as const,
  },
  errorMessage: {
    fontSize: dimensions.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    marginBottom: dimensions.spacing.xl,
    lineHeight: 22,
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: dimensions.containerPadding.horizontal,
  },
  processingIcon: {
    fontSize: 64,
    marginBottom: dimensions.spacing.lg,
  },
  processingText: {
    fontSize: dimensions.fontSize.lg,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
    textAlign: 'center' as const,
  },
  processingSubtext: {
    fontSize: dimensions.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center' as const,
  },
  actionButtons: {
    flexDirection: 'row' as const,
    gap: dimensions.spacing.sm,
  },
};