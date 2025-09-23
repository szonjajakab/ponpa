import React from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Outfit, ClothingItem } from '../../types';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';

interface OutfitCardProps {
  outfit: Outfit;
  clothingItems: ClothingItem[]; // Items that belong to this outfit
  onPress: (outfit: Outfit) => void;
  onEdit?: (outfit: Outfit) => void;
  onDelete?: (outfit: Outfit) => void;
  onToggleFavorite?: (outfit: Outfit) => void;
  onMarkWorn?: (outfit: Outfit) => void;
  onDuplicate?: (outfit: Outfit) => void;
  viewMode?: 'grid' | 'list';
}

export const OutfitCard: React.FC<OutfitCardProps> = ({
  outfit,
  clothingItems,
  onPress,
  onEdit,
  onDelete,
  onToggleFavorite,
  onMarkWorn,
  onDuplicate,
  viewMode = 'grid',
}) => {
  const handleDelete = () => {
    Alert.alert(
      'Delete Outfit',
      `Are you sure you want to delete "${outfit.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete?.(outfit),
        },
      ]
    );
  };

  const handleMarkWorn = () => {
    Alert.alert(
      'Mark as Worn',
      `Mark "${outfit.name}" as worn today?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: () => onMarkWorn?.(outfit),
        },
      ]
    );
  };

  const handleDuplicate = () => {
    Alert.alert(
      'Duplicate Outfit',
      `Create a copy of "${outfit.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Duplicate',
          onPress: () => onDuplicate?.(outfit),
        },
      ]
    );
  };

  const renderRightActions = () => (
    <View style={styles.rightActions}>
      {onMarkWorn && (
        <TouchableOpacity
          style={[styles.actionButton, styles.wornButton]}
          onPress={handleMarkWorn}
        >
          <Text style={styles.actionText}>👗</Text>
          <Text style={styles.actionLabel}>Wear</Text>
        </TouchableOpacity>
      )}

      {onDuplicate && (
        <TouchableOpacity
          style={[styles.actionButton, styles.duplicateButton]}
          onPress={handleDuplicate}
        >
          <Text style={styles.actionText}>📋</Text>
          <Text style={styles.actionLabel}>Copy</Text>
        </TouchableOpacity>
      )}

      {onEdit && (
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => onEdit(outfit)}
        >
          <Text style={styles.actionText}>✏️</Text>
          <Text style={styles.actionLabel}>Edit</Text>
        </TouchableOpacity>
      )}

      {onDelete && (
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDelete}
        >
          <Text style={styles.actionText}>🗑️</Text>
          <Text style={styles.actionLabel}>Delete</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderLeftActions = () => (
    <View style={styles.leftActions}>
      {onToggleFavorite && (
        <TouchableOpacity
          style={[styles.actionButton, styles.favoriteButton]}
          onPress={() => onToggleFavorite(outfit)}
        >
          <Text style={styles.actionText}>
            {outfit.is_favorite ? '❤️' : '🤍'}
          </Text>
          <Text style={styles.actionLabel}>
            {outfit.is_favorite ? 'Unfav' : 'Favorite'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderOutfitPreview = () => {
    // Show layered preview of outfit items
    const previewItems = clothingItems.slice(0, 4); // Show max 4 items
    const hasMoreItems = clothingItems.length > 4;

    if (outfit.image_url) {
      return (
        <Image
          source={{ uri: outfit.image_url }}
          style={[
            styles.outfitImage,
            viewMode === 'list' ? styles.listImage : styles.gridImage,
          ]}
          resizeMode="cover"
        />
      );
    }

    return (
      <View style={[
        styles.outfitPreview,
        viewMode === 'list' ? styles.listPreview : styles.gridPreview,
      ]}>
        {previewItems.length > 0 ? (
          <>
            {previewItems.map((item, index) => (
              <View
                key={item.id}
                style={[
                  styles.previewItem,
                  { zIndex: previewItems.length - index },
                  index > 0 && styles.layeredItem,
                ]}
              >
                {item.image_urls[0] ? (
                  <Image
                    source={{ uri: item.image_urls[0] }}
                    style={styles.previewItemImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.placeholderPreviewItem}>
                    <Text style={styles.placeholderText}>👔</Text>
                  </View>
                )}
              </View>
            ))}
            {hasMoreItems && (
              <View style={styles.moreItemsIndicator}>
                <Text style={styles.moreItemsText}>+{clothingItems.length - 4}</Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyPreview}>
            <Text style={styles.emptyPreviewText}>👗</Text>
          </View>
        )}
      </View>
    );
  };

  const renderMetadataTags = () => {
    const tags = [];
    if (outfit.occasion) tags.push(outfit.occasion);
    if (outfit.season) tags.push(outfit.season);
    if (outfit.weather) tags.push(outfit.weather);

    return tags.slice(0, 3).map((tag, index) => (
      <View key={index} style={styles.metadataTag}>
        <Text style={styles.metadataTagText}>{tag}</Text>
      </View>
    ));
  };

  const cardContent = (
    <TouchableOpacity
      style={[
        styles.card,
        viewMode === 'list' ? styles.listCard : styles.gridCard,
      ]}
      onPress={() => onPress(outfit)}
      activeOpacity={0.7}
    >
      <View style={[
        styles.imageContainer,
        viewMode === 'list' ? styles.listImageContainer : styles.gridImageContainer,
      ]}>
        {renderOutfitPreview()}

        {/* Favorite indicator */}
        {outfit.is_favorite && (
          <View style={styles.favoriteIndicator}>
            <Text style={styles.favoriteIcon}>❤️</Text>
          </View>
        )}

        {/* Item count indicator */}
        <View style={styles.itemCountIndicator}>
          <Text style={styles.itemCountText}>{clothingItems.length}</Text>
        </View>
      </View>

      <View style={[
        styles.content,
        viewMode === 'list' ? styles.listContent : styles.gridContent,
      ]}>
        <Text
          style={[
            styles.name,
            viewMode === 'list' ? styles.listName : styles.gridName,
          ]}
          numberOfLines={viewMode === 'list' ? 1 : 2}
        >
          {outfit.name}
        </Text>

        {outfit.description && (
          <Text
            style={[
              styles.description,
              viewMode === 'list' ? styles.listDescription : styles.gridDescription,
            ]}
            numberOfLines={viewMode === 'list' ? 1 : 2}
          >
            {outfit.description}
          </Text>
        )}

        {viewMode === 'list' && (
          <View style={styles.listStats}>
            <Text style={styles.statText}>
              Worn: {outfit.wear_count} times
            </Text>
            {outfit.last_worn && (
              <Text style={styles.statText}>
                Last: {new Date(outfit.last_worn).toLocaleDateString()}
              </Text>
            )}
          </View>
        )}

        <View style={styles.tagsContainer}>
          {renderMetadataTags()}
          {outfit.tags.length > 0 && (
            <>
              {outfit.tags.slice(0, 2).map((tag, index) => (
                <View key={`tag-${index}`} style={styles.customTag}>
                  <Text style={styles.customTagText}>{tag}</Text>
                </View>
              ))}
              {outfit.tags.length > 2 && (
                <Text style={styles.moreTagsText}>+{outfit.tags.length - 2}</Text>
              )}
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  // Only wrap in Swipeable if we have actions
  if (onEdit || onDelete || onToggleFavorite || onMarkWorn || onDuplicate) {
    return (
      <Swipeable
        renderRightActions={renderRightActions}
        renderLeftActions={renderLeftActions}
        rightThreshold={40}
        leftThreshold={40}
      >
        {cardContent}
      </Swipeable>
    );
  }

  return cardContent;
};

const styles = {
  card: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: dimensions.spacing.md,
  },
  gridCard: {
    padding: dimensions.spacing.sm,
  },
  listCard: {
    padding: dimensions.spacing.md,
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
  },
  imageContainer: {
    position: 'relative' as const,
  },
  gridImageContainer: {
    marginBottom: dimensions.spacing.sm,
  },
  listImageContainer: {
    marginRight: dimensions.spacing.md,
  },
  outfitImage: {
    backgroundColor: colors.gray100,
    borderRadius: dimensions.borderRadius.sm,
  },
  gridImage: {
    width: '100%' as const,
    aspectRatio: 1,
  },
  listImage: {
    width: 80,
    height: 80,
  },
  outfitPreview: {
    backgroundColor: colors.gray100,
    borderRadius: dimensions.borderRadius.sm,
    position: 'relative' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  gridPreview: {
    width: '100%' as const,
    aspectRatio: 1,
  },
  listPreview: {
    width: 80,
    height: 80,
  },
  previewItem: {
    position: 'absolute' as const,
    width: '60%',
    height: '60%',
    borderRadius: dimensions.borderRadius.xs,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  layeredItem: {
    top: 8,
    left: 8,
  },
  previewItemImage: {
    width: '100%',
    height: '100%',
    borderRadius: dimensions.borderRadius.xs,
  },
  placeholderPreviewItem: {
    width: '100%',
    height: '100%',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.gray100,
    borderRadius: dimensions.borderRadius.xs,
  },
  placeholderText: {
    fontSize: 16,
  },
  emptyPreview: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  emptyPreviewText: {
    fontSize: 32,
  },
  moreItemsIndicator: {
    position: 'absolute' as const,
    bottom: 4,
    right: 4,
    backgroundColor: colors.black,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  moreItemsText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '600' as const,
  },
  favoriteIndicator: {
    position: 'absolute' as const,
    top: 4,
    right: 4,
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
  itemCountIndicator: {
    position: 'absolute' as const,
    bottom: 4,
    left: 4,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  itemCountText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
  },
  gridContent: {},
  listContent: {
    flex: 1,
  },
  name: {
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  gridName: {
    fontSize: dimensions.fontSize.sm,
    marginBottom: 2,
  },
  listName: {
    fontSize: dimensions.fontSize.md,
    marginBottom: 4,
  },
  description: {
    color: colors.textSecondary,
  },
  gridDescription: {
    fontSize: dimensions.fontSize.xs,
    marginBottom: dimensions.spacing.xs,
  },
  listDescription: {
    fontSize: dimensions.fontSize.sm,
    marginBottom: dimensions.spacing.sm,
  },
  listStats: {
    marginBottom: dimensions.spacing.sm,
  },
  statText: {
    fontSize: dimensions.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  tagsContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 4,
  },
  metadataTag: {
    backgroundColor: colors.secondary + '20',
    borderRadius: dimensions.borderRadius.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  metadataTagText: {
    fontSize: 10,
    color: colors.secondary,
    fontWeight: '500' as const,
  },
  customTag: {
    backgroundColor: colors.primary + '20',
    borderRadius: dimensions.borderRadius.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  customTagText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '500' as const,
  },
  moreTagsText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontStyle: 'italic' as const,
  },
  // Swipe actions
  rightActions: {
    flexDirection: 'row' as const,
    alignItems: 'stretch' as const,
  },
  leftActions: {
    flexDirection: 'row' as const,
    alignItems: 'stretch' as const,
  },
  actionButton: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    width: 70,
    paddingHorizontal: 8,
  },
  favoriteButton: {
    backgroundColor: colors.primary,
  },
  wornButton: {
    backgroundColor: colors.success,
  },
  duplicateButton: {
    backgroundColor: colors.info,
  },
  editButton: {
    backgroundColor: colors.warning,
  },
  deleteButton: {
    backgroundColor: colors.error,
  },
  actionText: {
    fontSize: 18,
    marginBottom: 4,
  },
  actionLabel: {
    fontSize: 10,
    color: colors.white,
    fontWeight: '600' as const,
    textAlign: 'center' as const,
  },
};