import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, Alert, RefreshControl } from 'react-native';
import { TryOnSessionResponse } from '../../services/tryon';
import { useTryOnHistory } from '../../hooks/useTryOnPolling';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';

interface SessionHistoryProps {
  onSessionSelect?: (session: TryOnSessionResponse) => void;
  limit?: number;
  showDetails?: boolean;
}

export const SessionHistory: React.FC<SessionHistoryProps> = ({
  onSessionSelect,
  limit,
  showDetails = true,
}) => {
  const { sessions, isLoading, error, loadSessions, deleteSession, refreshSessions } = useTryOnHistory();
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (limit) {
      loadSessions(limit);
    }
  }, [limit, loadSessions]);

  const handleSessionPress = (session: TryOnSessionResponse) => {
    if (onSessionSelect) {
      onSessionSelect(session);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    Alert.alert(
      'Delete Session',
      'Are you sure you want to delete this try-on session? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingIds(prev => new Set([...prev, sessionId]));
              await deleteSession(sessionId);
            } catch (error) {
              console.error('Error deleting session:', error);
              Alert.alert('Error', 'Failed to delete session. Please try again.');
            } finally {
              setDeletingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(sessionId);
                return newSet;
              });
            }
          },
        },
      ]
    );
  };

  const getStatusIcon = (status: TryOnSessionResponse['status']): string => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      case 'in_progress':
        return '🎨';
      case 'pending':
        return '⏳';
      case 'cancelled':
        return '⛔';
      default:
        return '❓';
    }
  };

  const getStatusText = (status: TryOnSessionResponse['status']): string => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'in_progress':
        return 'In Progress';
      case 'pending':
        return 'Pending';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: TryOnSessionResponse['status']): string => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'failed':
        return colors.error;
      case 'in_progress':
        return colors.primary;
      case 'pending':
        return colors.warning;
      case 'cancelled':
        return colors.textSecondary;
      default:
        return colors.textSecondary;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderSessionCard = ({ item: session }: { item: TryOnSessionResponse }) => {
    const isDeleting = deletingIds.has(session.session_id);
    const statusColor = getStatusColor(session.status);

    return (
      <TouchableOpacity
        style={[styles.sessionCard, isDeleting && styles.deletingCard]}
        onPress={() => handleSessionPress(session)}
        activeOpacity={0.7}
        disabled={isDeleting}
      >
        <View style={styles.sessionContent}>
          {/* Thumbnail */}
          <View style={styles.thumbnailContainer}>
            {session.generated_image_url && session.status === 'completed' ? (
              <Image
                source={{ uri: session.generated_image_url }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.thumbnailPlaceholder}>
                <Text style={styles.thumbnailIcon}>
                  {getStatusIcon(session.status)}
                </Text>
              </View>
            )}

            {/* Status badge */}
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusBadgeText}>
                {session.status === 'completed' ? '✓' : getStatusIcon(session.status)}
              </Text>
            </View>
          </View>

          {/* Session Info */}
          <View style={styles.sessionInfo}>
            <View style={styles.sessionHeader}>
              <Text style={styles.sessionId}>
                Session {session.session_id.slice(0, 8)}
              </Text>
              <Text style={styles.sessionDate}>
                {formatDate(session.created_at)}
              </Text>
            </View>

            <View style={styles.sessionStatus}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {getStatusText(session.status)}
              </Text>
              {session.progress_percentage < 100 && session.status !== 'failed' && (
                <Text style={styles.progressText}>
                  {session.progress_percentage}%
                </Text>
              )}
            </View>

            {showDetails && session.ai_description && (
              <Text style={styles.sessionDescription} numberOfLines={2}>
                {session.ai_description}
              </Text>
            )}

            {session.error_message && (
              <Text style={styles.errorText} numberOfLines={1}>
                Error: {session.error_message}
              </Text>
            )}
          </View>

          {/* Actions */}
          <View style={styles.sessionActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteSession(session.session_id)}
              disabled={isDeleting}
            >
              <Text style={styles.deleteButtonText}>
                {isDeleting ? '...' : '🗑️'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>🎨</Text>
      <Text style={styles.emptyStateTitle}>No Try-On History</Text>
      <Text style={styles.emptyStateText}>
        Your virtual try-on sessions will appear here once you start generating images.
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Try-On History</Text>
      <Text style={styles.headerSubtitle}>
        {sessions.length > 0
          ? `${sessions.length} session${sessions.length !== 1 ? 's' : ''}`
          : 'No sessions yet'
        }
      </Text>
    </View>
  );

  if (error) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Unable to Load History</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={refreshSessions}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sessions}
        renderItem={renderSessionCard}
        keyExtractor={(item) => item.session_id}
        contentContainerStyle={[
          styles.listContainer,
          sessions.length === 0 && !isLoading && styles.emptyListContainer,
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshSessions}
            tintColor={colors.primary}
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

// Compact version for smaller spaces
export const CompactSessionHistory: React.FC<{
  onSessionSelect?: (session: TryOnSessionResponse) => void;
  limit?: number;
}> = ({ onSessionSelect, limit = 5 }) => {
  const { sessions, isLoading, refreshSessions } = useTryOnHistory();

  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  const handleSessionPress = (session: TryOnSessionResponse) => {
    if (onSessionSelect) {
      onSessionSelect(session);
    }
  };

  const renderCompactSession = ({ item: session }: { item: TryOnSessionResponse }) => (
    <TouchableOpacity
      style={styles.compactSessionCard}
      onPress={() => handleSessionPress(session)}
      activeOpacity={0.7}
    >
      <View style={styles.compactThumbnail}>
        {session.generated_image_url && session.status === 'completed' ? (
          <Image
            source={{ uri: session.generated_image_url }}
            style={styles.compactThumbnailImage}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.compactThumbnailIcon}>
            {session.status === 'completed' ? '✅' :
             session.status === 'failed' ? '❌' : '🎨'}
          </Text>
        )}
      </View>

      <View style={styles.compactInfo}>
        <Text style={styles.compactSessionId} numberOfLines={1}>
          {session.session_id.slice(0, 12)}...
        </Text>
        <Text style={styles.compactDate}>
          {new Date(session.created_at).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const limitedSessions = sessions.slice(0, limit);

  return (
    <View style={styles.compactContainer}>
      <Text style={styles.compactTitle}>Recent Try-Ons</Text>

      {limitedSessions.length > 0 ? (
        <FlatList
          data={limitedSessions}
          renderItem={renderCompactSession}
          keyExtractor={(item) => item.session_id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.compactList}
        />
      ) : (
        <Text style={styles.compactEmptyText}>No sessions yet</Text>
      )}
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: dimensions.containerPadding.horizontal,
    paddingTop: dimensions.spacing.lg,
    paddingBottom: dimensions.spacing.md,
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
  listContainer: {
    paddingHorizontal: dimensions.containerPadding.horizontal,
    paddingBottom: dimensions.spacing.xl,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center' as const,
  },
  separator: {
    height: dimensions.spacing.sm,
  },
  sessionCard: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deletingCard: {
    opacity: 0.5,
  },
  sessionContent: {
    flexDirection: 'row' as const,
    padding: dimensions.spacing.md,
  },
  thumbnailContainer: {
    position: 'relative' as const,
    marginRight: dimensions.spacing.md,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: dimensions.borderRadius.sm,
    backgroundColor: colors.gray100,
  },
  thumbnailPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: dimensions.borderRadius.sm,
    backgroundColor: colors.gray100,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  thumbnailIcon: {
    fontSize: 24,
  },
  statusBadge: {
    position: 'absolute' as const,
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: colors.white,
  },
  statusBadgeText: {
    fontSize: 10,
    color: colors.white,
    fontWeight: 'bold' as const,
  },
  sessionInfo: {
    flex: 1,
    justifyContent: 'space-between' as const,
  },
  sessionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 4,
  },
  sessionId: {
    fontSize: dimensions.fontSize.md,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  sessionDate: {
    fontSize: dimensions.fontSize.xs,
    color: colors.textSecondary,
  },
  sessionStatus: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  statusText: {
    fontSize: dimensions.fontSize.sm,
    fontWeight: '500' as const,
  },
  progressText: {
    fontSize: dimensions.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '500' as const,
  },
  sessionDescription: {
    fontSize: dimensions.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  errorText: {
    fontSize: dimensions.fontSize.xs,
    color: colors.error,
    fontStyle: 'italic' as const,
  },
  sessionActions: {
    justifyContent: 'flex-start' as const,
    marginLeft: dimensions.spacing.sm,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  deleteButton: {
    backgroundColor: colors.error + '20',
  },
  deleteButtonText: {
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingTop: dimensions.spacing.xxxl,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: dimensions.spacing.lg,
  },
  emptyStateTitle: {
    fontSize: dimensions.fontSize.lg,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
    textAlign: 'center' as const,
  },
  emptyStateText: {
    fontSize: dimensions.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    paddingHorizontal: dimensions.spacing.xl,
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
    fontSize: dimensions.fontSize.lg,
    fontWeight: '600' as const,
    color: colors.error,
    marginBottom: dimensions.spacing.sm,
    textAlign: 'center' as const,
  },
  errorMessage: {
    fontSize: dimensions.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    marginBottom: dimensions.spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: dimensions.borderRadius.md,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: dimensions.fontSize.md,
    fontWeight: '600' as const,
  },
  // Compact styles
  compactContainer: {
    marginVertical: dimensions.spacing.md,
  },
  compactTitle: {
    fontSize: dimensions.fontSize.md,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
    paddingHorizontal: dimensions.containerPadding.horizontal,
  },
  compactList: {
    paddingHorizontal: dimensions.containerPadding.horizontal,
  },
  compactSessionCard: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.sm,
    padding: dimensions.spacing.sm,
    marginRight: dimensions.spacing.sm,
    alignItems: 'center' as const,
    width: 80,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  compactThumbnail: {
    width: 40,
    height: 40,
    borderRadius: dimensions.borderRadius.xs,
    backgroundColor: colors.gray100,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: dimensions.spacing.xs,
  },
  compactThumbnailImage: {
    width: 40,
    height: 40,
    borderRadius: dimensions.borderRadius.xs,
  },
  compactThumbnailIcon: {
    fontSize: 20,
  },
  compactInfo: {
    alignItems: 'center' as const,
  },
  compactSessionId: {
    fontSize: 8,
    fontWeight: '500' as const,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  compactDate: {
    fontSize: 8,
    color: colors.textSecondary,
  },
  compactEmptyText: {
    fontSize: dimensions.fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic' as const,
    paddingHorizontal: dimensions.containerPadding.horizontal,
  },
};