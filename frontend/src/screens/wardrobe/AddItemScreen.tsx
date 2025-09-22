import React, { useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { ClothingItemCreate, ClothingItemUpdate, MainStackParamList } from '../../types';
import { ItemForm } from '../../components/wardrobe/ItemForm';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';
import { apiService } from '../../services/api';

type AddItemScreenNavigationProp = StackNavigationProp<MainStackParamList, 'AddItem'>;
type AddItemScreenRouteProp = RouteProp<MainStackParamList, 'AddItem'>;

interface AddItemScreenProps {
  navigation: AddItemScreenNavigationProp;
  route: AddItemScreenRouteProp;
}

export const AddItemScreen: React.FC<AddItemScreenProps> = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: ClothingItemCreate) => {
    try {
      setIsLoading(true);

      // Create the clothing item
      const newItem = await apiService.createClothingItem(data);

      Alert.alert(
        'Success',
        `"${newItem.name}" has been added to your wardrobe!`,
        [
          {
            text: 'View Item',
            onPress: () => {
              navigation.replace('ItemDetails', { itemId: newItem.id });
            },
          },
          {
            text: 'Add Another',
            onPress: () => {
              // Stay on the add screen
              setIsLoading(false);
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
      console.error('Error creating item:', error);
      Alert.alert(
        'Error',
        'Failed to add the item to your wardrobe. Please try again.',
        [{ text: 'OK' }]
      );
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (isLoading) return;

    Alert.alert(
      'Cancel Adding Item',
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
          <Text style={styles.title}>Add New Item</Text>
          <Text style={styles.subtitle}>Add a clothing item to your wardrobe</Text>
        </View>

        <View style={styles.headerRight} />
      </View>

      {/* Form */}
      <ItemForm
        onSubmit={handleSubmit as (data: ClothingItemCreate | ClothingItemUpdate) => void}
        onCancel={handleCancel}
        isLoading={isLoading}
        isEditing={false}
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
  headerRight: {
    width: 44,
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
  },
};