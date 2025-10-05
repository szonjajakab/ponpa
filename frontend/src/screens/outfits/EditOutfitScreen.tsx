import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, Alert, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { OutfitStackParamList, Outfit, ClothingItem, OutfitCreate } from '../../types';
import { OutfitBuilder } from '../../components/outfits/OutfitBuilder';
import { apiService } from '../../services/api';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';

type EditOutfitScreenNavigationProp = StackNavigationProp<OutfitStackParamList, 'EditOutfit'>;
type EditOutfitScreenRouteProp = RouteProp<OutfitStackParamList, 'EditOutfit'>;

interface EditOutfitScreenProps {
  navigation: EditOutfitScreenNavigationProp;
  route: EditOutfitScreenRouteProp;
}

export const EditOutfitScreen: React.FC<EditOutfitScreenProps> = ({
  navigation,
  route,
}) => {
  const { outfitId } = route.params;
  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    loadData();
  }, [outfitId]);

  const loadData = async () => {
    try {
      setIsLoadingData(true);

      const [outfitResponse, itemsResponse] = await Promise.all([
        apiService.getOutfit(outfitId),
        apiService.getClothingItems()
      ]);

      setOutfit(outfitResponse);
      setClothingItems(itemsResponse);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load outfit data. Please try again.');
      navigation.goBack();
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSaveOutfit = async (outfitData: OutfitCreate) => {
    try {
      setIsLoading(true);

      const updatedOutfit = await apiService.updateOutfit(outfitId, outfitData);

      Alert.alert(
        'Success!',
        'Your outfit has been updated successfully.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error updating outfit:', error);
      Alert.alert('Error', 'Failed to update outfit. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Changes',
      'Are you sure you want to cancel? Your changes will be lost.',
      [
        { text: 'Continue Editing', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  // Show loading screen while data is loading
  if (isLoadingData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading outfit...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error if outfit not found
  if (!outfit) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.errorTitle}>Outfit Not Found</Text>
          <Text style={styles.errorText}>
            The outfit you're trying to edit could not be found.
          </Text>
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

  // Show message if no items available
  if (clothingItems.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateIcon}>👕</Text>
          <Text style={styles.emptyStateTitle}>No Clothing Items</Text>
          <Text style={styles.emptyStateText}>
            You need to add some clothing items to your wardrobe before editing outfits.
          </Text>
          <TouchableOpacity
            style={styles.addItemsButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.addItemsButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Convert outfit to initial outfit format for OutfitBuilder
  const initialOutfit: Partial<OutfitCreate> = {
    name: outfit.name,
    description: outfit.description,
    clothing_item_ids: outfit.clothing_item_ids,
    tags: outfit.tags,
    occasion: outfit.occasion,
    season: outfit.season,
    weather: outfit.weather,
  };

  return (
    <SafeAreaView style={styles.container}>
      <OutfitBuilder
        availableItems={clothingItems}
        initialOutfit={initialOutfit}
        onSave={handleSaveOutfit}
        onCancel={handleCancel}
        isLoading={isLoading}
      />
    </SafeAreaView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: dimensions.containerPadding.horizontal,
  },
  loadingText: {
    fontSize: dimensions.fontSize.lg,
    color: colors.textSecondary,
    textAlign: 'center' as const,
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
    fontWeight: '600' as const,
    color: colors.textPrimary,
    textAlign: 'center' as const,
    marginBottom: dimensions.spacing.sm,
  },
  errorText: {
    fontSize: dimensions.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: dimensions.spacing.xl,
  },
  errorButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: dimensions.spacing.xl,
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.lg,
  },
  errorButtonText: {
    color: colors.white,
    fontSize: dimensions.fontSize.md,
    fontWeight: '600' as const,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: dimensions.containerPadding.horizontal,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: dimensions.spacing.lg,
  },
  emptyStateTitle: {
    fontSize: dimensions.fontSize.xl,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    textAlign: 'center' as const,
    marginBottom: dimensions.spacing.sm,
  },
  emptyStateText: {
    fontSize: dimensions.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: dimensions.spacing.xl,
  },
  addItemsButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: dimensions.spacing.xl,
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.lg,
  },
  addItemsButtonText: {
    color: colors.white,
    fontSize: dimensions.fontSize.md,
    fontWeight: '600' as const,
  },
};