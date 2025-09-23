import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, Alert, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { OutfitStackParamList, Outfit, ClothingItem, OutfitCreate } from '../../types';
import { OutfitBuilder } from '../../components/outfits/OutfitBuilder';
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

      // TODO: Replace with actual API calls
      // const [outfitResponse, itemsResponse] = await Promise.all([
      //   outfitService.getOutfit(outfitId),
      //   wardrobeService.getClothingItems()
      // ]);

      // Mock data for development
      const mockOutfit: Outfit = {
        id: outfitId,
        user_uid: 'user1',
        name: 'Business Casual',
        description: 'Perfect for office meetings and professional events',
        clothing_item_ids: ['item1', 'item2', 'item3', 'item7'],
        tags: ['professional', 'comfortable', 'versatile'],
        occasion: 'work',
        season: 'fall',
        weather: 'mild',
        image_url: undefined,
        is_favorite: true,
        wear_count: 5,
        last_worn: new Date('2023-12-01'),
        created_at: new Date('2023-11-15'),
        updated_at: new Date('2023-12-01'),
      };

      const mockClothingItems: ClothingItem[] = [
        {
          id: 'item1',
          user_uid: 'user1',
          name: 'Blue Jeans',
          category: 'bottoms' as any,
          brand: 'Levi\'s',
          size: 'M' as any,
          colors: [{ name: 'Blue', hex_code: '#0000FF' }],
          description: 'Classic blue jeans',
          image_urls: [],
          tags: ['casual', 'everyday'],
          is_favorite: true,
          wear_count: 12,
          last_worn: new Date('2023-12-01'),
          created_at: new Date('2023-01-15'),
          updated_at: new Date('2023-12-01'),
        },
        {
          id: 'item2',
          user_uid: 'user1',
          name: 'White Button Shirt',
          category: 'tops' as any,
          brand: 'Calvin Klein',
          size: 'M' as any,
          colors: [{ name: 'White', hex_code: '#FFFFFF' }],
          description: 'Classic white button-down shirt',
          image_urls: [],
          tags: ['formal', 'work', 'versatile'],
          is_favorite: false,
          wear_count: 8,
          last_worn: new Date('2023-11-28'),
          created_at: new Date('2023-02-10'),
          updated_at: new Date('2023-11-28'),
        },
        {
          id: 'item3',
          user_uid: 'user1',
          name: 'Navy Blazer',
          category: 'outerwear' as any,
          brand: 'Hugo Boss',
          size: 'M' as any,
          colors: [{ name: 'Navy', hex_code: '#000080' }],
          description: 'Professional navy blazer',
          image_urls: [],
          tags: ['formal', 'business', 'professional'],
          is_favorite: true,
          wear_count: 6,
          last_worn: new Date('2023-11-30'),
          created_at: new Date('2023-03-01'),
          updated_at: new Date('2023-11-30'),
        },
        {
          id: 'item4',
          user_uid: 'user1',
          name: 'Black Sneakers',
          category: 'shoes' as any,
          brand: 'Nike',
          size: '10' as any,
          colors: [{ name: 'Black', hex_code: '#000000' }],
          description: 'Comfortable black sneakers',
          image_urls: [],
          tags: ['casual', 'comfortable', 'athletic'],
          is_favorite: false,
          wear_count: 15,
          last_worn: new Date('2023-12-02'),
          created_at: new Date('2023-04-05'),
          updated_at: new Date('2023-12-02'),
        },
        {
          id: 'item5',
          user_uid: 'user1',
          name: 'Red Scarf',
          category: 'accessories' as any,
          brand: 'Zara',
          size: undefined,
          colors: [{ name: 'Red', hex_code: '#FF0000' }],
          description: 'Soft wool scarf',
          image_urls: [],
          tags: ['winter', 'warm', 'stylish'],
          is_favorite: false,
          wear_count: 3,
          last_worn: new Date('2023-11-25'),
          created_at: new Date('2023-10-15'),
          updated_at: new Date('2023-11-25'),
        },
        {
          id: 'item6',
          user_uid: 'user1',
          name: 'Summer Dress',
          category: 'dresses' as any,
          brand: 'H&M',
          size: 'S' as any,
          colors: [{ name: 'Floral', hex_code: '#FFB6C1' }],
          description: 'Light floral summer dress',
          image_urls: [],
          tags: ['summer', 'casual', 'comfortable'],
          is_favorite: true,
          wear_count: 4,
          last_worn: new Date('2023-09-15'),
          created_at: new Date('2023-05-20'),
          updated_at: new Date('2023-09-15'),
        },
        {
          id: 'item7',
          user_uid: 'user1',
          name: 'Leather Belt',
          category: 'accessories' as any,
          brand: 'Coach',
          size: 'M' as any,
          colors: [{ name: 'Brown', hex_code: '#8B4513' }],
          description: 'Genuine leather belt',
          image_urls: [],
          tags: ['formal', 'leather', 'classic'],
          is_favorite: false,
          wear_count: 10,
          last_worn: new Date('2023-11-29'),
          created_at: new Date('2023-01-30'),
          updated_at: new Date('2023-11-29'),
        },
        {
          id: 'item8',
          user_uid: 'user1',
          name: 'Gray Hoodie',
          category: 'tops' as any,
          brand: 'Adidas',
          size: 'L' as any,
          colors: [{ name: 'Gray', hex_code: '#808080' }],
          description: 'Cozy gray hoodie',
          image_urls: [],
          tags: ['casual', 'comfortable', 'athletic'],
          is_favorite: false,
          wear_count: 7,
          last_worn: new Date('2023-11-26'),
          created_at: new Date('2023-08-10'),
          updated_at: new Date('2023-11-26'),
        },
      ];

      setOutfit(mockOutfit);
      setClothingItems(mockClothingItems);
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

      // TODO: Replace with actual API call
      // const updatedOutfit = await outfitService.updateOutfit(outfitId, outfitData);

      console.log('Updating outfit:', outfitId, outfitData);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

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