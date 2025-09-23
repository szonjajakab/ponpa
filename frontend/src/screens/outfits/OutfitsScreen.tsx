import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { OutfitStackParamList, Outfit, ClothingItem, OutfitFilters, OutfitSort, OutfitViewMode } from '../../types';
import { OutfitCard } from '../../components/outfits/OutfitCard';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';

type OutfitsScreenNavigationProp = StackNavigationProp<OutfitStackParamList, 'OutfitsMain'>;

interface OutfitsScreenProps {
  navigation: OutfitsScreenNavigationProp;
}

export const OutfitsScreen: React.FC<OutfitsScreenProps> = ({ navigation }) => {
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<OutfitViewMode>('grid');
  const [filters, setFilters] = useState<OutfitFilters>({});
  const [sort, setSort] = useState<OutfitSort>({ field: 'updated_at', direction: 'desc' });

  // Mock data - replace with actual API calls
  const loadOutfits = useCallback(async () => {
    try {
      setIsLoading(true);

      // TODO: Replace with actual API call
      // const response = await outfitService.getOutfits(filters, sort);

      // Mock data for development
      const mockOutfits: Outfit[] = [
        {
          id: '1',
          user_uid: 'user1',
          name: 'Business Casual',
          description: 'Perfect for office meetings',
          clothing_item_ids: ['item1', 'item2', 'item3'],
          tags: ['professional', 'comfortable'],
          occasion: 'work',
          season: 'fall',
          weather: 'mild',
          image_url: undefined,
          is_favorite: true,
          wear_count: 5,
          last_worn: new Date('2023-12-01'),
          created_at: new Date('2023-11-15'),
          updated_at: new Date('2023-12-01'),
        },
        {
          id: '2',
          user_uid: 'user1',
          name: 'Weekend Vibes',
          description: 'Relaxed and stylish',
          clothing_item_ids: ['item4', 'item5'],
          tags: ['relaxed', 'weekend'],
          occasion: 'casual',
          season: 'summer',
          weather: 'sunny',
          image_url: undefined,
          is_favorite: false,
          wear_count: 2,
          last_worn: new Date('2023-11-28'),
          created_at: new Date('2023-11-20'),
          updated_at: new Date('2023-11-28'),
        },
      ];

      const mockClothingItems: ClothingItem[] = [
        {
          id: 'item1',
          user_uid: 'user1',
          name: 'Blue Blazer',
          category: 'outerwear' as any,
          brand: 'Hugo Boss',
          size: 'M' as any,
          colors: [{ name: 'Navy Blue', hex_code: '#000080' }],
          description: 'Classic navy blazer',
          image_urls: [],
          tags: ['formal', 'business'],
          is_favorite: false,
          wear_count: 8,
          created_at: new Date(),
          updated_at: new Date(),
        },
        // Add more mock items as needed
      ];

      setOutfits(mockOutfits);
      setClothingItems(mockClothingItems);
    } catch (error) {
      console.error('Error loading outfits:', error);
      Alert.alert('Error', 'Failed to load outfits. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filters, sort]);

  useFocusEffect(
    useCallback(() => {
      loadOutfits();
    }, [loadOutfits])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadOutfits();
  };

  const handleCreateOutfit = () => {
    navigation.navigate('CreateOutfit');
  };

  const handleOutfitPress = (outfit: Outfit) => {
    navigation.navigate('OutfitDetails', { outfitId: outfit.id });
  };

  const handleEditOutfit = (outfit: Outfit) => {
    navigation.navigate('EditOutfit', { outfitId: outfit.id });
  };

  const handleDeleteOutfit = async (outfit: Outfit) => {
    try {
      // TODO: Replace with actual API call
      // await outfitService.deleteOutfit(outfit.id);

      setOutfits(prev => prev.filter(o => o.id !== outfit.id));
      Alert.alert('Success', 'Outfit deleted successfully.');
    } catch (error) {
      console.error('Error deleting outfit:', error);
      Alert.alert('Error', 'Failed to delete outfit. Please try again.');
    }
  };

  const handleToggleFavorite = async (outfit: Outfit) => {
    try {
      // TODO: Replace with actual API call
      // await outfitService.updateOutfit(outfit.id, { is_favorite: !outfit.is_favorite });

      setOutfits(prev =>
        prev.map(o =>
          o.id === outfit.id ? { ...o, is_favorite: !o.is_favorite } : o
        )
      );
    } catch (error) {
      console.error('Error updating favorite:', error);
      Alert.alert('Error', 'Failed to update favorite. Please try again.');
    }
  };

  const handleMarkWorn = async (outfit: Outfit) => {
    try {
      // TODO: Replace with actual API call
      // await outfitService.markAsWorn(outfit.id);

      setOutfits(prev =>
        prev.map(o =>
          o.id === outfit.id
            ? {
                ...o,
                wear_count: o.wear_count + 1,
                last_worn: new Date(),
                updated_at: new Date(),
              }
            : o
        )
      );
      Alert.alert('Success', 'Outfit marked as worn!');
    } catch (error) {
      console.error('Error marking as worn:', error);
      Alert.alert('Error', 'Failed to mark as worn. Please try again.');
    }
  };

  const handleDuplicateOutfit = async (outfit: Outfit) => {
    try {
      // TODO: Replace with actual API call
      // const duplicatedOutfit = await outfitService.duplicateOutfit(outfit.id);

      const duplicatedOutfit: Outfit = {
        ...outfit,
        id: `${outfit.id}_copy_${Date.now()}`,
        name: `${outfit.name} (Copy)`,
        wear_count: 0,
        last_worn: undefined,
        created_at: new Date(),
        updated_at: new Date(),
      };

      setOutfits(prev => [duplicatedOutfit, ...prev]);
      Alert.alert('Success', 'Outfit duplicated successfully!');
    } catch (error) {
      console.error('Error duplicating outfit:', error);
      Alert.alert('Error', 'Failed to duplicate outfit. Please try again.');
    }
  };

  const handleFilterPress = () => {
    navigation.navigate('OutfitFilterModal', {
      currentFilters: filters,
      onApplyFilters: setFilters,
    });
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
  };

  const getItemsForOutfit = (outfit: Outfit): ClothingItem[] => {
    return clothingItems.filter(item => outfit.clothing_item_ids.includes(item.id));
  };

  const renderOutfitCard = ({ item: outfit }: { item: Outfit }) => {
    const outfitItems = getItemsForOutfit(outfit);

    return (
      <OutfitCard
        outfit={outfit}
        clothingItems={outfitItems}
        onPress={handleOutfitPress}
        onEdit={handleEditOutfit}
        onDelete={handleDeleteOutfit}
        onToggleFavorite={handleToggleFavorite}
        onMarkWorn={handleMarkWorn}
        onDuplicate={handleDuplicateOutfit}
        viewMode={viewMode}
      />
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.title}>My Outfits</Text>
        <Text style={styles.subtitle}>{outfits.length} outfit{outfits.length !== 1 ? 's' : ''}</Text>
      </View>

      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleFilterPress}
        >
          <Text style={styles.headerButtonText}>🔍</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={toggleViewMode}
        >
          <Text style={styles.headerButtonText}>
            {viewMode === 'grid' ? '📋' : '⊞'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>👗</Text>
      <Text style={styles.emptyStateTitle}>No Outfits Yet</Text>
      <Text style={styles.emptyStateText}>
        Create your first outfit by combining your favorite clothing items
      </Text>
      <TouchableOpacity
        style={styles.createFirstOutfitButton}
        onPress={handleCreateOutfit}
      >
        <Text style={styles.createFirstOutfitButtonText}>Create Your First Outfit</Text>
      </TouchableOpacity>
    </View>
  );

  const hasActiveFilters = Object.keys(filters).some(key =>
    filters[key as keyof OutfitFilters] !== undefined &&
    filters[key as keyof OutfitFilters] !== ''
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}

      {hasActiveFilters && (
        <View style={styles.activeFiltersBar}>
          <Text style={styles.activeFiltersText}>Filters active</Text>
          <TouchableOpacity
            onPress={() => setFilters({})}
            style={styles.clearFiltersButton}
          >
            <Text style={styles.clearFiltersText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={outfits}
        renderItem={renderOutfitCard}
        keyExtractor={(item) => item.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode} // Force re-render when view mode changes
        contentContainerStyle={[
          styles.listContainer,
          outfits.length === 0 && styles.emptyListContainer,
        ]}
        showsVerticalScrollIndicator={false}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
        ListEmptyComponent={renderEmptyState}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreateOutfit}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
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
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: dimensions.fontSize.xxl,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: dimensions.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row' as const,
    gap: dimensions.spacing.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  headerButtonText: {
    fontSize: 18,
  },
  activeFiltersBar: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: dimensions.containerPadding.horizontal,
    paddingVertical: dimensions.spacing.sm,
    backgroundColor: colors.primary + '10',
    borderBottomWidth: 1,
    borderBottomColor: colors.primary + '30',
  },
  activeFiltersText: {
    fontSize: dimensions.fontSize.sm,
    color: colors.primary,
    fontWeight: '500' as const,
  },
  clearFiltersButton: {
    paddingHorizontal: dimensions.spacing.sm,
    paddingVertical: dimensions.spacing.xs,
  },
  clearFiltersText: {
    fontSize: dimensions.fontSize.sm,
    color: colors.primary,
    fontWeight: '600' as const,
  },
  listContainer: {
    padding: dimensions.containerPadding.horizontal,
    paddingBottom: 80, // Space for FAB
  },
  emptyListContainer: {
    flex: 1,
  },
  emptyState: {
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
  createFirstOutfitButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: dimensions.spacing.xl,
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.lg,
  },
  createFirstOutfitButtonText: {
    color: colors.white,
    fontSize: dimensions.fontSize.md,
    fontWeight: '600' as const,
  },
  fab: {
    position: 'absolute' as const,
    bottom: dimensions.spacing.xl,
    right: dimensions.spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 24,
    color: colors.white,
    fontWeight: '300' as const,
  },
};