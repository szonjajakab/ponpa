import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  StatusBar,
  Dimensions,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { ClothingItem, MainStackParamList } from '../../types';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';
import { apiService } from '../../services/api';

type ItemDetailsScreenNavigationProp = StackNavigationProp<MainStackParamList, 'ItemDetails'>;
type ItemDetailsScreenRouteProp = RouteProp<MainStackParamList, 'ItemDetails'>;

interface ItemDetailsScreenProps {
  navigation: ItemDetailsScreenNavigationProp;
  route: ItemDetailsScreenRouteProp;
}

const { width: screenWidth } = Dimensions.get('window');

export const ItemDetailsScreen: React.FC<ItemDetailsScreenProps> = ({ navigation, route }) => {
  const { itemId } = route.params;
  const [item, setItem] = useState<ClothingItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isWornLoading, setIsWornLoading] = useState(false);

  useEffect(() => {
    loadItem();
  }, [itemId]);

  const loadItem = async () => {
    try {
      setIsLoading(true);
      const loadedItem = await apiService.getClothingItem(itemId);
      setItem(loadedItem);
    } catch (error) {
      console.error('Error loading item:', error);
      Alert.alert(
        'Error',
        'Failed to load the item. Please try again.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    if (item) {
      navigation.navigate('EditItem', { itemId: item.id });
    }
  };

  const handleToggleFavorite = async () => {
    if (!item) return;

    try {
      const updatedItem = await apiService.updateClothingItem(item.id, {
        is_favorite: !item.is_favorite,
      });
      setItem(updatedItem);
    } catch (error) {
      console.error('Error updating favorite:', error);
      Alert.alert('Error', 'Failed to update favorite status.');
    }
  };

  const handleMarkWorn = async () => {
    if (!item || isWornLoading) return;

    try {
      setIsWornLoading(true);
      const updatedItem = await apiService.recordClothingItemWear(item.id);
      setItem(updatedItem);
      Alert.alert('Success', `Marked "${item.name}" as worn today!`);
    } catch (error) {
      console.error('Error recording wear:', error);
      Alert.alert('Error', 'Failed to record wear. Please try again.');
    } finally {
      setIsWornLoading(false);
    }
  };

  const handleDelete = () => {
    if (!item) return;

    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteClothingItem(item.id);
              Alert.alert(
                'Success',
                `"${item.name}" has been deleted from your wardrobe.`,
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.navigate('Wardrobe'),
                  },
                ]
              );
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert('Error', 'Failed to delete item. Please try again.');
            }
          },
        },
      ]
    );
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const getCategoryDisplayName = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading item...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Item not found</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.headerButtonText}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleToggleFavorite}
          >
            <Text style={styles.headerButtonText}>
              {item.is_favorite ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleEdit}
          >
            <Text style={styles.headerButtonText}>✏️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        {item.image_urls.length > 0 ? (
          <View style={styles.imageSection}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
                setSelectedImageIndex(index);
              }}
            >
              {item.image_urls.map((uri, index) => (
                <Image
                  key={index}
                  source={{ uri }}
                  style={styles.image}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>

            {item.image_urls.length > 1 && (
              <View style={styles.imageIndicators}>
                {item.image_urls.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.imageIndicator,
                      selectedImageIndex === index && styles.activeImageIndicator,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.placeholderImageContainer}>
            <Text style={styles.placeholderImageText}>👔</Text>
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Title and Basic Info */}
          <View style={styles.titleSection}>
            <Text style={styles.itemName}>{item.name}</Text>
            <View style={styles.basicInfo}>
              <Text style={styles.category}>
                {getCategoryDisplayName(item.category)}
              </Text>
              {item.brand && <Text style={styles.brand}>• {item.brand}</Text>}
              {item.size && <Text style={styles.size}>• {item.size}</Text>}
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.quickActionButton, styles.wornButton]}
              onPress={handleMarkWorn}
              disabled={isWornLoading}
            >
              <Text style={styles.quickActionIcon}>👕</Text>
              <Text style={styles.quickActionText}>
                {isWornLoading ? 'Recording...' : 'Mark as Worn'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionButton, styles.favoriteButton]}
              onPress={handleToggleFavorite}
            >
              <Text style={styles.quickActionIcon}>
                {item.is_favorite ? '❤️' : '🤍'}
              </Text>
              <Text style={styles.quickActionText}>
                {item.is_favorite ? 'Unfavorite' : 'Favorite'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionButton, styles.editButton]}
              onPress={handleEdit}
            >
              <Text style={styles.quickActionIcon}>✏️</Text>
              <Text style={styles.quickActionText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Statistics */}
          <View style={styles.statsSection}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{item.wear_count}</Text>
              <Text style={styles.statLabel}>Times Worn</Text>
            </View>
            {item.last_worn && (
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {formatDate(item.last_worn)}
                </Text>
                <Text style={styles.statLabel}>Last Worn</Text>
              </View>
            )}
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {formatDate(item.created_at)}
              </Text>
              <Text style={styles.statLabel}>Added</Text>
            </View>
          </View>

          {/* Colors */}
          {item.colors.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Colors</Text>
              <View style={styles.colorsContainer}>
                {item.colors.map((color, index) => (
                  <View key={index} style={styles.colorChip}>
                    <Text style={styles.colorText}>{color.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Description */}
          {item.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.sectionContent}>{item.description}</Text>
            </View>
          )}

          {/* Tags */}
          {item.tags.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.tagsContainer}>
                {item.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Additional Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>

            {item.purchase_price && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Purchase Price</Text>
                <Text style={styles.detailValue}>${item.purchase_price}</Text>
              </View>
            )}

            {item.condition && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Condition</Text>
                <Text style={styles.detailValue}>{item.condition}</Text>
              </View>
            )}

            {item.purchase_date && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Purchase Date</Text>
                <Text style={styles.detailValue}>
                  {formatDate(item.purchase_date)}
                </Text>
              </View>
            )}
          </View>

          {/* Notes */}
          {item.notes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.sectionContent}>{item.notes}</Text>
            </View>
          )}

          {/* Delete Button */}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <Text style={styles.deleteButtonText}>Delete Item</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: dimensions.containerPadding.horizontal,
    paddingVertical: dimensions.spacing.md,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderRadius: 22,
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerButtonText: {
    fontSize: 20,
  },
  headerActions: {
    flexDirection: 'row' as const,
    gap: dimensions.spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  imageSection: {
    height: screenWidth,
    position: 'relative' as const,
  },
  image: {
    width: screenWidth,
    height: screenWidth,
  },
  imageIndicators: {
    position: 'absolute' as const,
    bottom: dimensions.spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    gap: dimensions.spacing.xs,
  },
  imageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white + '60',
  },
  activeImageIndicator: {
    backgroundColor: colors.white,
  },
  placeholderImageContainer: {
    height: screenWidth,
    backgroundColor: colors.gray100,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  placeholderImageText: {
    fontSize: 64,
    opacity: 0.5,
  },
  content: {
    padding: dimensions.containerPadding.horizontal,
  },
  titleSection: {
    marginBottom: dimensions.spacing.lg,
  },
  itemName: {
    fontSize: dimensions.fontSize.xxl,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.xs,
  },
  basicInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flexWrap: 'wrap' as const,
  },
  category: {
    fontSize: dimensions.fontSize.md,
    color: colors.textSecondary,
  },
  brand: {
    fontSize: dimensions.fontSize.md,
    color: colors.textSecondary,
    marginLeft: dimensions.spacing.xs,
  },
  size: {
    fontSize: dimensions.fontSize.md,
    color: colors.textSecondary,
    marginLeft: dimensions.spacing.xs,
  },
  quickActions: {
    flexDirection: 'row' as const,
    gap: dimensions.spacing.sm,
    marginBottom: dimensions.spacing.xl,
  },
  quickActionButton: {
    flex: 1,
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    alignItems: 'center' as const,
    backgroundColor: colors.gray100,
  },
  wornButton: {
    backgroundColor: colors.success + '20',
  },
  favoriteButton: {
    backgroundColor: colors.primary + '20',
  },
  editButton: {
    backgroundColor: colors.warning + '20',
  },
  quickActionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: dimensions.fontSize.xs,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  statsSection: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    paddingVertical: dimensions.spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginBottom: dimensions.spacing.xl,
  },
  statItem: {
    alignItems: 'center' as const,
  },
  statValue: {
    fontSize: dimensions.fontSize.lg,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: dimensions.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center' as const,
  },
  section: {
    marginBottom: dimensions.spacing.xl,
  },
  sectionTitle: {
    fontSize: dimensions.fontSize.lg,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.md,
  },
  sectionContent: {
    fontSize: dimensions.fontSize.md,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  colorsContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: dimensions.spacing.sm,
  },
  colorChip: {
    backgroundColor: colors.gray100,
    borderRadius: dimensions.borderRadius.md,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
  },
  colorText: {
    fontSize: dimensions.fontSize.sm,
    color: colors.textPrimary,
  },
  tagsContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: dimensions.spacing.sm,
  },
  tag: {
    backgroundColor: colors.primary + '20',
    borderRadius: dimensions.borderRadius.md,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
  },
  tagText: {
    fontSize: dimensions.fontSize.sm,
    color: colors.primary,
    fontWeight: '500' as const,
  },
  detailRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: dimensions.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: dimensions.fontSize.md,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: dimensions.fontSize.md,
    color: colors.textPrimary,
    fontWeight: '500' as const,
  },
  deleteButton: {
    marginTop: dimensions.spacing.xl,
    marginBottom: dimensions.spacing.xxxl,
    paddingVertical: dimensions.spacing.md,
    backgroundColor: colors.error,
    borderRadius: dimensions.borderRadius.md,
    alignItems: 'center' as const,
  },
  deleteButtonText: {
    color: colors.white,
    fontSize: dimensions.fontSize.md,
    fontWeight: '600' as const,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  loadingText: {
    fontSize: dimensions.fontSize.lg,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: dimensions.containerPadding.horizontal,
  },
  errorText: {
    fontSize: dimensions.fontSize.lg,
    color: colors.error,
    textAlign: 'center' as const,
    marginBottom: dimensions.spacing.lg,
  },
  retryButton: {
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    backgroundColor: colors.primary,
    borderRadius: dimensions.borderRadius.md,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: dimensions.fontSize.md,
    fontWeight: '600' as const,
  },
};