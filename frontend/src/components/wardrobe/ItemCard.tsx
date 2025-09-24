import React from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { ClothingItem } from '../../types';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';

interface ItemCardProps {
  item: ClothingItem;
  onPress: (item: ClothingItem) => void;
  onEdit?: (item: ClothingItem) => void;
  onDelete?: (item: ClothingItem) => void;
  onToggleFavorite?: (item: ClothingItem) => void;
  onMarkWorn?: (item: ClothingItem) => void;
  viewMode?: 'grid' | 'list';
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  onPress,
  onEdit,
  onDelete,
  onToggleFavorite,
  onMarkWorn,
  viewMode = 'grid',
}) => {
  const primaryImage = item.image_urls[0];
  const categoryDisplayName = item.category.charAt(0).toUpperCase() + item.category.slice(1);
  const brandDisplay = item.brand ? ` • ${item.brand}` : '';
  const sizeDisplay = item.size ? ` • ${item.size}` : '';

  const handleDelete = () => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete?.(item),
        },
      ]
    );
  };

  const handleMarkWorn = () => {
    Alert.alert(
      'Mark as Worn',
      `Mark "${item.name}" as worn today?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: () => onMarkWorn?.(item),
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
          <Text style={styles.actionText}>👕</Text>
          <Text style={styles.actionLabel}>Worn</Text>
        </TouchableOpacity>
      )}

      {onEdit && (
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => onEdit(item)}
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
          onPress={() => onToggleFavorite(item)}
        >
          <Text style={styles.actionText}>
            {item.is_favorite ? '❤️' : '🤍'}
          </Text>
          <Text style={styles.actionLabel}>
            {item.is_favorite ? 'Unfav' : 'Favorite'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const cardContent = (
    <TouchableOpacity
      style={[
        styles.card,
        viewMode === 'list' ? styles.listCard : styles.gridCard,
      ]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={[
        styles.imageContainer,
        viewMode === 'list' ? styles.listImageContainer : styles.gridImageContainer,
      ]}>
        {primaryImage ? (
          <Image
            source={{ uri: primaryImage }}
            style={[
              styles.image,
              viewMode === 'list' ? styles.listImage : styles.gridImage,
            ]}
            resizeMode="cover"
          />
        ) : (
          <View style={[
            styles.placeholderImage,
            viewMode === 'list' ? styles.listImage : styles.gridImage,
          ]}>
            <Text style={styles.placeholderText}>👔</Text>
          </View>
        )}

        {/* Favorite indicator */}
        {item.is_favorite && (
          <View style={styles.favoriteIndicator}>
            <Text style={styles.favoriteIcon}>❤️</Text>
          </View>
        )}

        {/* Image count indicator */}
        {item.image_urls.length > 1 && (
          <View style={styles.imageCountIndicator}>
            <Text style={styles.imageCountText}>{item.image_urls.length}</Text>
          </View>
        )}
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
          {item.name}
        </Text>

        <Text
          style={[
            styles.details,
            viewMode === 'list' ? styles.listDetails : styles.gridDetails,
          ]}
          numberOfLines={1}
        >
          {categoryDisplayName}{brandDisplay}{sizeDisplay}
        </Text>

        {viewMode === 'list' && (
          <View style={styles.listStats}>
            <Text style={styles.statText}>
              Worn: {item.wear_count} times
            </Text>
            {item.last_worn && (
              <Text style={styles.statText}>
                Last: {new Date(item.last_worn).toLocaleDateString()}
              </Text>
            )}
          </View>
        )}

        {item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.slice(0, viewMode === 'list' ? 3 : 2).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {item.tags.length > (viewMode === 'list' ? 3 : 2) && (
              <Text style={styles.moreTagsText}>
                +{item.tags.length - (viewMode === 'list' ? 3 : 2)}
              </Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  // Only wrap in Swipeable if we have actions
  if (onEdit || onDelete || onToggleFavorite || onMarkWorn) {
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
  image: {
    backgroundColor: colors.gray100,
  },
  gridImage: {
    width: '100%' as const,
    aspectRatio: 1,
    borderRadius: dimensions.borderRadius.sm,
  },
  listImage: {
    width: 80,
    height: 80,
    borderRadius: dimensions.borderRadius.sm,
  },
  placeholderImage: {
    backgroundColor: colors.gray100,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  placeholderText: {
    fontSize: 24,
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
  imageCountIndicator: {
    position: 'absolute' as const,
    bottom: 4,
    right: 4,
    backgroundColor: colors.black,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  imageCountText: {
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
  details: {
    color: colors.textSecondary,
  },
  gridDetails: {
    fontSize: dimensions.fontSize.xs,
    marginBottom: dimensions.spacing.xs,
  },
  listDetails: {
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
  tag: {
    backgroundColor: colors.primary + '20',
    borderRadius: dimensions.borderRadius.xs,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: {
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