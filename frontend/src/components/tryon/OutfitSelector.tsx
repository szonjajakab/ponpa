import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, TextInput, Alert } from 'react-native';
import { Outfit } from '../../types';
import { apiService } from '../../services/api';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';

interface OutfitSelectorProps {
  selectedOutfit: Outfit | null;
  onOutfitSelect: (outfit: Outfit) => void;
  disabled?: boolean;
}

export const OutfitSelector: React.FC<OutfitSelectorProps> = ({
  selectedOutfit,
  onOutfitSelect,
  disabled = false,
}) => {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOutfits();
  }, []);

  const loadOutfits = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const outfitsData = await apiService.getOutfits();
      setOutfits(outfitsData);
    } catch (err) {
      console.error('Error loading outfits:', err);
      setError('Failed to load outfits');
      Alert.alert('Error', 'Failed to load your outfits. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOutfits = outfits.filter(outfit =>
    outfit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    outfit.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    outfit.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderOutfitCard = ({ item: outfit }: { item: Outfit }) => {
    const isSelected = selectedOutfit?.id === outfit.id;

    return (
      <TouchableOpacity
        style={[
          styles.outfitCard,
          isSelected && styles.selectedOutfitCard,
          disabled && styles.disabledCard,
        ]}
        onPress={() => !disabled && onOutfitSelect(outfit)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <View style={styles.outfitImageContainer}>
          {outfit.image_url ? (
            <Image
              source={{ uri: outfit.image_url }}
              style={styles.outfitImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>👗</Text>
            </View>
          )}

          {/* Selection indicator */}
          {isSelected && (
            <View style={styles.selectionOverlay}>
              <View style={styles.selectionIndicator}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
            </View>
          )}

          {/* Favorite indicator */}
          {outfit.is_favorite && (
            <View style={styles.favoriteIndicator}>
              <Text style={styles.favoriteIcon}>❤️</Text>
            </View>
          )}
        </View>

        <View style={styles.outfitInfo}>
          <Text style={styles.outfitName} numberOfLines={1}>
            {outfit.name}
          </Text>

          {outfit.description && (
            <Text style={styles.outfitDescription} numberOfLines={2}>
              {outfit.description}
            </Text>
          )}

          <View style={styles.outfitMeta}>
            <Text style={styles.itemCount}>
              {outfit.clothing_item_ids.length} item{outfit.clothing_item_ids.length !== 1 ? 's' : ''}
            </Text>

            {outfit.occasion && (
              <Text style={styles.occasion}>• {outfit.occasion}</Text>
            )}
          </View>

          {outfit.tags && outfit.tags.length > 0 && (
            <View style={styles.tagContainer}>
              {outfit.tags.slice(0, 2).map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
              {outfit.tags.length > 2 && (
                <Text style={styles.moreTagsText}>+{outfit.tags.length - 2}</Text>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>👗</Text>
      <Text style={styles.emptyStateTitle}>
        {searchQuery ? 'No matching outfits' : 'No outfits yet'}
      </Text>
      <Text style={styles.emptyStateText}>
        {searchQuery
          ? 'Try adjusting your search terms'
          : 'Create some outfits first to use virtual try-on'
        }
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Select an Outfit</Text>
      <Text style={styles.headerSubtitle}>
        Choose an outfit to generate your virtual try-on
      </Text>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search your outfits..."
          placeholderTextColor={colors.inputPlaceholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!disabled}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearSearchButton}
            onPress={() => setSearchQuery('')}
            disabled={disabled}
          >
            <Text style={styles.clearSearchText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {selectedOutfit && (
        <View style={styles.selectedOutfitBanner}>
          <Text style={styles.selectedBannerText}>
            Selected: {selectedOutfit.name}
          </Text>
          {!disabled && (
            <TouchableOpacity
              style={styles.clearSelectionButton}
              onPress={() => onOutfitSelect(null as any)}
            >
              <Text style={styles.clearSelectionText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={loadOutfits}
          disabled={disabled}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredOutfits}
        renderItem={renderOutfitCard}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={[
          styles.listContainer,
          filteredOutfits.length === 0 && styles.emptyListContainer,
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        refreshing={isLoading}
        onRefresh={loadOutfits}
      />
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
    paddingVertical: dimensions.spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: dimensions.spacing.sm,
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
    marginBottom: dimensions.spacing.md,
  },
  searchContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: dimensions.spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: dimensions.inputHeight.sm,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: dimensions.borderRadius.md,
    paddingHorizontal: dimensions.spacing.md,
    fontSize: dimensions.fontSize.sm,
    backgroundColor: colors.inputBackground,
    color: colors.textPrimary,
  },
  clearSearchButton: {
    marginLeft: dimensions.spacing.sm,
    padding: dimensions.spacing.xs,
  },
  clearSearchText: {
    fontSize: dimensions.fontSize.md,
    color: colors.textSecondary,
  },
  selectedOutfitBanner: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.primary + '15',
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: dimensions.borderRadius.md,
    marginTop: dimensions.spacing.sm,
  },
  selectedBannerText: {
    fontSize: dimensions.fontSize.sm,
    color: colors.primary,
    fontWeight: '600' as const,
  },
  clearSelectionButton: {
    paddingHorizontal: dimensions.spacing.sm,
    paddingVertical: dimensions.spacing.xs,
  },
  clearSelectionText: {
    fontSize: dimensions.fontSize.sm,
    color: colors.primary,
    fontWeight: '500' as const,
  },
  listContainer: {
    padding: dimensions.containerPadding.horizontal,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center' as const,
  },
  outfitCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.md,
    marginBottom: dimensions.spacing.md,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedOutfitCard: {
    borderColor: colors.primary,
  },
  disabledCard: {
    opacity: 0.6,
  },
  outfitImageContainer: {
    position: 'relative' as const,
  },
  outfitImage: {
    width: '100%',
    aspectRatio: 1,
    borderTopLeftRadius: dimensions.borderRadius.md,
    borderTopRightRadius: dimensions.borderRadius.md,
    backgroundColor: colors.gray100,
  },
  placeholderImage: {
    width: '100%',
    aspectRatio: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.gray100,
    borderTopLeftRadius: dimensions.borderRadius.md,
    borderTopRightRadius: dimensions.borderRadius.md,
  },
  placeholderText: {
    fontSize: 32,
  },
  selectionOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary + '20',
    borderTopLeftRadius: dimensions.borderRadius.md,
    borderTopRightRadius: dimensions.borderRadius.md,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  selectionIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  checkmark: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold' as const,
  },
  favoriteIndicator: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    backgroundColor: colors.white,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  favoriteIcon: {
    fontSize: 14,
  },
  outfitInfo: {
    padding: dimensions.spacing.sm,
  },
  outfitName: {
    fontSize: dimensions.fontSize.md,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  outfitDescription: {
    fontSize: dimensions.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: dimensions.spacing.xs,
  },
  outfitMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: dimensions.spacing.xs,
  },
  itemCount: {
    fontSize: dimensions.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '500' as const,
  },
  occasion: {
    fontSize: dimensions.fontSize.xs,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  tagContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 4,
  },
  tag: {
    backgroundColor: colors.primary + '20',
    borderRadius: dimensions.borderRadius.xs,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 8,
    color: colors.primary,
    fontWeight: '500' as const,
  },
  moreTagsText: {
    fontSize: 8,
    color: colors.textSecondary,
    fontStyle: 'italic' as const,
    alignSelf: 'center' as const,
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
  errorText: {
    fontSize: dimensions.fontSize.md,
    color: colors.error,
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
};