import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, Alert, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { OutfitStackParamList, ClothingItem, OutfitCreate } from '../../types';
import { apiService } from '../../services/api';
import { OutfitBuilder } from '../../components/outfits/OutfitBuilder';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';

type CreateOutfitScreenNavigationProp = StackNavigationProp<OutfitStackParamList, 'CreateOutfit'>;
type CreateOutfitScreenRouteProp = RouteProp<OutfitStackParamList, 'CreateOutfit'>;

interface CreateOutfitScreenProps {
  navigation: CreateOutfitScreenNavigationProp;
  route: CreateOutfitScreenRouteProp;
}

export const CreateOutfitScreen: React.FC<CreateOutfitScreenProps> = ({
  navigation,
  route,
}) => {
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(true);

  useEffect(() => {
    loadClothingItems();
  }, []);

  const loadClothingItems = async () => {
    try {
      setIsLoadingItems(true);
      const items = await apiService.getClothingItems();
      setClothingItems(items);
    } catch (error) {
      console.error('Error loading clothing items:', error);
      Alert.alert('Error', 'Failed to load your wardrobe items. Please try again.');
    } finally {
      setIsLoadingItems(false);
    }
  };

  const handleCreateOutfit = async (outfitData: OutfitCreate) => {
    try {
      setIsLoading(true);

      const newOutfit = await apiService.createOutfit(outfitData);

      Alert.alert(
        'Success',
        `Outfit "${outfitData.name}" has been created!`,
        [
          {
            text: 'View Outfits',
            onPress: () => navigation.goBack(),
          },
          {
            text: 'Create Another',
            onPress: () => {
              // Reset the form or stay on the create screen
              setIsLoading(false);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error creating outfit:', error);
      Alert.alert('Error', 'Failed to create outfit. Please try again.');
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Creating Outfit',
      'Are you sure you want to cancel? Any unsaved changes will be lost.',
      [
        { text: "Don't Cancel", style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          disabled={isLoading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Create Outfit</Text>

        <View style={styles.headerSpacer} />
      </View>

      {/* Outfit Builder */}
      {!isLoadingItems && (
        <OutfitBuilder
          availableItems={clothingItems}
          onSave={handleCreateOutfit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      )}

      {isLoadingItems && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your wardrobe...</Text>
        </View>
      )}
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
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: dimensions.containerPadding.horizontal,
    paddingVertical: dimensions.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cancelButton: {
    padding: dimensions.spacing.xs,
  },
  cancelButtonText: {
    fontSize: dimensions.fontSize.md,
    color: colors.error,
    fontWeight: '500' as const,
  },
  title: {
    fontSize: dimensions.fontSize.xl,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 50, // Same width as cancel button to center title
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: dimensions.containerPadding.horizontal,
  },
  loadingText: {
    fontSize: dimensions.fontSize.md,
    color: colors.textSecondary,
  },
};