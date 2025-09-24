import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { ClothingItem, ClothingItemUpdate, MainStackParamList } from '../../types';
import { ItemForm } from '../../components/wardrobe/ItemForm';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';
import { apiService } from '../../services/api';

type EditItemScreenNavigationProp = StackNavigationProp<MainStackParamList, 'EditItem'>;
type EditItemScreenRouteProp = RouteProp<MainStackParamList, 'EditItem'>;

interface EditItemScreenProps {
  navigation: EditItemScreenNavigationProp;
  route: EditItemScreenRouteProp;
}

export const EditItemScreen: React.FC<EditItemScreenProps> = ({ navigation, route }) => {
  const { itemId } = route.params;
  const [item, setItem] = useState<ClothingItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingItem, setIsLoadingItem] = useState(true);

  useEffect(() => {
    loadItem();
  }, [itemId]);

  const loadItem = async () => {
    try {
      setIsLoadingItem(true);
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
      setIsLoadingItem(false);
    }
  };

  const handleSubmit = async (data: ClothingItemUpdate) => {
    if (!item) return;

    try {
      setIsLoading(true);

      // Update the clothing item
      const updatedItem = await apiService.updateClothingItem(item.id, data);

      Alert.alert(
        'Success',
        `"${updatedItem.name}" has been updated!`,
        [
          {
            text: 'View Item',
            onPress: () => {
              navigation.replace('ItemDetails', { itemId: updatedItem.id });
            },
          },
          {
            text: 'Done',
            onPress: () => {
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error updating item:', error);
      Alert.alert(
        'Error',
        'Failed to update the item. Please try again.',
        [{ text: 'OK' }]
      );
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (isLoading) return;

    Alert.alert(
      'Cancel Editing',
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

  const handleBackPress = () => {
    handleCancel();
  };

  const handleDeleteItem = () => {
    if (!item || isLoading) return;

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
                    onPress: () => {
                      // Navigate back to wardrobe screen
                      navigation.navigate('TabNavigator', { screen: 'Wardrobe' });
                    },
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

  if (isLoadingItem) {
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
          style={styles.backButton}
          onPress={handleBackPress}
          disabled={isLoading}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.title}>Edit Item</Text>
          <Text style={styles.subtitle}>{item.name}</Text>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteItem}
          disabled={isLoading}
        >
          <Text style={styles.deleteButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>

      {/* Form */}
      <ItemForm
        initialData={item}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isLoading}
        isEditing={true}
      />
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
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderRadius: 22,
  },
  backButtonText: {
    fontSize: 24,
    color: colors.textPrimary,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center' as const,
  },
  deleteButton: {
    width: 44,
    height: 44,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderRadius: 22,
  },
  deleteButtonText: {
    fontSize: 20,
  },
  title: {
    fontSize: dimensions.fontSize.xl,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: dimensions.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center' as const,
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