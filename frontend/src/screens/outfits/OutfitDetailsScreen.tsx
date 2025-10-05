import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Alert, Share } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { OutfitStackParamList, Outfit, ClothingItem } from '../../types';
import { OutfitPreview } from '../../components/outfits/OutfitPreview';
import { ItemCard } from '../../components/wardrobe/ItemCard';
import { apiService } from '../../services/api';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';

type OutfitDetailsScreenNavigationProp = StackNavigationProp<OutfitStackParamList, 'OutfitDetails'>;
type OutfitDetailsScreenRouteProp = RouteProp<OutfitStackParamList, 'OutfitDetails'>;

interface OutfitDetailsScreenProps {
  navigation: OutfitDetailsScreenNavigationProp;
  route: OutfitDetailsScreenRouteProp;
}

export const OutfitDetailsScreen: React.FC<OutfitDetailsScreenProps> = ({
  navigation,
  route,
}) => {
  const { outfitId } = route.params;
  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOutfitDetails();
  }, [outfitId]);

  const loadOutfitDetails = async () => {
    try {
      setIsLoading(true);

      // Get outfit details
      const outfitResponse = await apiService.getOutfit(outfitId);

      // Get all clothing items (we'll filter to just the ones in this outfit)
      const allClothingItems = await apiService.getClothingItems();

      // Filter to only items in this outfit
      const outfitClothingItems = allClothingItems.filter(item =>
        outfitResponse.clothing_item_ids.includes(item.id)
      );

      setOutfit(outfitResponse);
      setClothingItems(outfitClothingItems);
    } catch (error) {
      console.error('Error loading outfit details:', error);
      Alert.alert('Error', 'Failed to load outfit details. Please try again.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    navigation.navigate('EditOutfit', { outfitId });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Outfit',
      `Are you sure you want to delete "${outfit?.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Starting outfit deletion for ID:', outfitId);
              await apiService.deleteOutfit(outfitId);
              console.log('Outfit deletion successful');

              Alert.alert('Success', 'Outfit deleted successfully.', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              console.error('Error deleting outfit:', error);
              Alert.alert('Error', 'Failed to delete outfit. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleToggleFavorite = async () => {
    if (!outfit) return;

    try {
      const updatedOutfit = await apiService.updateOutfit(outfit.id, {
        is_favorite: !outfit.is_favorite
      });

      setOutfit(updatedOutfit);
    } catch (error) {
      console.error('Error updating favorite:', error);
      Alert.alert('Error', 'Failed to update favorite. Please try again.');
    }
  };

  const handleMarkWorn = async () => {
    if (!outfit) return;

    Alert.alert(
      'Mark as Worn',
      `Mark "${outfit.name}" as worn today?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              const updatedOutfit = await apiService.recordOutfitWear(outfit.id);
              setOutfit(updatedOutfit);

              Alert.alert('Success', 'Outfit marked as worn!');
            } catch (error) {
              console.error('Error marking as worn:', error);
              Alert.alert('Error', 'Failed to mark as worn. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDuplicate = async () => {
    if (!outfit) return;

    try {
      // TODO: Replace with actual API call
      // const duplicatedOutfit = await outfitService.duplicateOutfit(outfit.id);

      Alert.alert('Success', 'Outfit duplicated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error duplicating outfit:', error);
      Alert.alert('Error', 'Failed to duplicate outfit. Please try again.');
    }
  };

  const handleShare = async () => {
    if (!outfit) return;

    try {
      const shareContent = {
        message: `Check out my outfit "${outfit.name}"! Created with Ponpa Wardrobe App.`,
        title: outfit.name,
      };

      await Share.share(shareContent);
    } catch (error) {
      console.error('Error sharing outfit:', error);
      Alert.alert('Error', 'Failed to share outfit. Please try again.');
    }
  };

  const handleItemPress = (item: ClothingItem) => {
    // TODO: Navigate to item details screen
    console.log('Navigate to item details:', item.id);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>

      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.headerActionButton}
          onPress={handleShare}
        >
          <Text style={styles.headerActionText}>↗</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerActionButton}
          onPress={handleEdit}
        >
          <Text style={styles.headerActionText}>✏️</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerActionButton}
          onPress={handleDelete}
        >
          <Text style={styles.headerActionText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderOutfitInfo = () => {
    if (!outfit) return null;

    return (
      <View style={styles.outfitInfo}>
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{outfit.name}</Text>
            <TouchableOpacity onPress={handleToggleFavorite}>
              <Text style={styles.favoriteIcon}>
                {outfit.is_favorite ? '❤️' : '🤍'}
              </Text>
            </TouchableOpacity>
          </View>

          {outfit.description && (
            <Text style={styles.description}>{outfit.description}</Text>
          )}
        </View>

        <View style={styles.metadataSection}>
          {outfit.occasion && (
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>Occasion:</Text>
              <View style={styles.metadataTag}>
                <Text style={styles.metadataTagText}>{outfit.occasion}</Text>
              </View>
            </View>
          )}

          {outfit.season && (
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>Season:</Text>
              <View style={styles.metadataTag}>
                <Text style={styles.metadataTagText}>{outfit.season}</Text>
              </View>
            </View>
          )}

          {outfit.weather && (
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>Weather:</Text>
              <View style={styles.metadataTag}>
                <Text style={styles.metadataTagText}>{outfit.weather}</Text>
              </View>
            </View>
          )}

          {outfit.tags.length > 0 && (
            <View style={styles.metadataItem}>
              <Text style={styles.metadataLabel}>Tags:</Text>
              <View style={styles.tagsContainer}>
                {outfit.tags.map((tag, index) => (
                  <View key={index} style={styles.customTag}>
                    <Text style={styles.customTagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{outfit.wear_count}</Text>
            <Text style={styles.statLabel}>Times Worn</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {outfit.last_worn ? new Date(outfit.last_worn).toLocaleDateString() : 'Never'}
            </Text>
            <Text style={styles.statLabel}>Last Worn</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statValue}>{clothingItems.length}</Text>
            <Text style={styles.statLabel}>Items</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderActionButtons = () => (
    <View style={styles.actionButtons}>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={handleMarkWorn}
      >
        <Text style={styles.actionButtonText}>👗 Mark as Worn</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, styles.secondaryActionButton]}
        onPress={handleDuplicate}
      >
        <Text style={[styles.actionButtonText, styles.secondaryActionButtonText]}>
          📋 Duplicate
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading outfit...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!outfit) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Outfit not found</Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Outfit Preview */}
        <View style={styles.previewSection}>
          <OutfitPreview
            items={clothingItems}
            size="large"
            showItemNames={false}
          />
        </View>

        {/* Outfit Information */}
        {renderOutfitInfo()}

        {/* Action Buttons */}
        {renderActionButtons()}

        {/* Clothing Items */}
        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>Items in this Outfit</Text>
          {clothingItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onPress={handleItemPress}
              viewMode="list"
            />
          ))}
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
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  backButtonText: {
    fontSize: 20,
    color: colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row' as const,
    gap: dimensions.spacing.sm,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  headerActionText: {
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: dimensions.spacing.xl,
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
    paddingHorizontal: dimensions.containerPadding.horizontal,
  },
  errorText: {
    fontSize: dimensions.fontSize.lg,
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.lg,
  },
  errorButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: dimensions.spacing.xl,
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
  },
  errorButtonText: {
    color: colors.white,
    fontSize: dimensions.fontSize.md,
    fontWeight: '600' as const,
  },
  previewSection: {
    alignItems: 'center' as const,
    paddingVertical: dimensions.spacing.xl,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  outfitInfo: {
    backgroundColor: colors.white,
    padding: dimensions.containerPadding.horizontal,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleSection: {
    marginBottom: dimensions.spacing.lg,
  },
  titleRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: dimensions.spacing.sm,
  },
  title: {
    fontSize: dimensions.fontSize.xxl,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    flex: 1,
  },
  favoriteIcon: {
    fontSize: 24,
    marginLeft: dimensions.spacing.md,
  },
  description: {
    fontSize: dimensions.fontSize.md,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  metadataSection: {
    marginBottom: dimensions.spacing.lg,
  },
  metadataItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: dimensions.spacing.sm,
  },
  metadataLabel: {
    fontSize: dimensions.fontSize.sm,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    width: 80,
  },
  metadataTag: {
    backgroundColor: colors.secondary + '20',
    paddingHorizontal: dimensions.spacing.sm,
    paddingVertical: dimensions.spacing.xs,
    borderRadius: dimensions.borderRadius.sm,
    marginLeft: dimensions.spacing.sm,
  },
  metadataTagText: {
    fontSize: dimensions.fontSize.sm,
    color: colors.secondary,
    fontWeight: '500' as const,
  },
  tagsContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: dimensions.spacing.xs,
    marginLeft: dimensions.spacing.sm,
  },
  customTag: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: dimensions.spacing.sm,
    paddingVertical: dimensions.spacing.xs,
    borderRadius: dimensions.borderRadius.sm,
  },
  customTagText: {
    fontSize: dimensions.fontSize.sm,
    color: colors.primary,
    fontWeight: '500' as const,
  },
  statsSection: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    paddingVertical: dimensions.spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statItem: {
    alignItems: 'center' as const,
  },
  statValue: {
    fontSize: dimensions.fontSize.lg,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: dimensions.fontSize.xs,
    color: colors.textSecondary,
    marginTop: dimensions.spacing.xs,
  },
  actionButtons: {
    flexDirection: 'row' as const,
    gap: dimensions.spacing.md,
    paddingHorizontal: dimensions.containerPadding.horizontal,
    paddingVertical: dimensions.spacing.lg,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    alignItems: 'center' as const,
  },
  secondaryActionButton: {
    backgroundColor: colors.gray200,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: dimensions.fontSize.md,
    fontWeight: '600' as const,
  },
  secondaryActionButtonText: {
    color: colors.textPrimary,
  },
  itemsSection: {
    padding: dimensions.containerPadding.horizontal,
  },
  sectionTitle: {
    fontSize: dimensions.fontSize.lg,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.md,
  },
};