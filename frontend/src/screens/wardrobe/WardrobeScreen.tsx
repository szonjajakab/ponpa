import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import {
  ClothingItem,
  ClothingItemFilters,
  ClothingItemSort,
  WardrobeViewMode,
  MainStackParamList,
} from '../../types';
import { ItemGrid } from '../../components/wardrobe/ItemGrid';
import { ItemList } from '../../components/wardrobe/ItemList';
import { FilterModal } from '../../components/wardrobe/FilterModal';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';
import { apiService } from '../../services/api';

type WardrobeScreenNavigationProp = StackNavigationProp<MainStackParamList, 'Wardrobe'>;

interface WardrobeScreenProps {
  navigation: WardrobeScreenNavigationProp;
}

export const WardrobeScreen: React.FC<WardrobeScreenProps> = ({ navigation }) => {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ClothingItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [viewMode, setViewMode] = useState<WardrobeViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ClothingItemFilters>({});
  const [sort, setSort] = useState<ClothingItemSort>({
    field: 'created_at',
    direction: 'desc',
  });
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  const PAGE_SIZE = 20;

  // Load items from API
  const loadItems = useCallback(async (page: number = 0, refresh: boolean = false) => {
    if (isLoading) return;

    try {
      setIsLoading(true);

      const response = await apiService.getClothingItems(
        filters,
        PAGE_SIZE,
        page * PAGE_SIZE
      );

      if (refresh || page === 0) {
        setItems(response);
        setCurrentPage(0);
      } else {
        setItems(prev => [...prev, ...response]);
        setCurrentPage(page);
      }

      setHasMore(response.length === PAGE_SIZE);
    } catch (error) {
      console.error('Error loading items:', error);
      Alert.alert('Error', 'Failed to load clothing items. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [filters, isLoading]);

  // Filter and search items locally
  useEffect(() => {
    let filtered = [...items];

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        item =>
          item.name.toLowerCase().includes(query) ||
          item.brand?.toLowerCase().includes(query) ||
          item.tags.some(tag => tag.toLowerCase().includes(query)) ||
          item.category.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sort.field];
      const bValue = b[sort.field];

      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;

      return sort.direction === 'desc' ? -comparison : comparison;
    });

    setFilteredItems(filtered);
  }, [items, searchQuery, sort]);

  // Load initial data
  useFocusEffect(
    useCallback(() => {
      loadItems(0, true);
    }, [])
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadItems(0, true);
    setIsRefreshing(false);
  }, [loadItems]);

  const handleLoadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      loadItems(currentPage + 1, false);
    }
  }, [hasMore, isLoading, currentPage, loadItems]);

  const handleItemPress = (item: ClothingItem) => {
    navigation.navigate('ItemDetails', { itemId: item.id });
  };

  const handleItemEdit = (item: ClothingItem) => {
    navigation.navigate('EditItem', { itemId: item.id });
  };

  const handleItemDelete = async (item: ClothingItem) => {
    try {
      await apiService.deleteClothingItem(item.id);
      setItems(prev => prev.filter(i => i.id !== item.id));
      Alert.alert('Success', `"${item.name}" has been deleted.`);
    } catch (error) {
      console.error('Error deleting item:', error);
      Alert.alert('Error', 'Failed to delete item. Please try again.');
    }
  };

  const handleToggleFavorite = async (item: ClothingItem) => {
    try {
      const updatedItem = await apiService.updateClothingItem(item.id, {
        is_favorite: !item.is_favorite,
      });

      setItems(prev =>
        prev.map(i => (i.id === item.id ? updatedItem : i))
      );
    } catch (error) {
      console.error('Error updating favorite:', error);
      Alert.alert('Error', 'Failed to update favorite status.');
    }
  };

  const handleMarkWorn = async (item: ClothingItem) => {
    try {
      const updatedItem = await apiService.recordClothingItemWear(item.id);
      setItems(prev =>
        prev.map(i => (i.id === item.id ? updatedItem : i))
      );
      Alert.alert('Success', `Marked "${item.name}" as worn today!`);
    } catch (error) {
      console.error('Error recording wear:', error);
      Alert.alert('Error', 'Failed to record wear. Please try again.');
    }
  };

  const handleAddItem = () => {
    navigation.navigate('AddItem');
  };

  const handleFilterPress = () => {
    setIsFilterModalVisible(true);
  };

  const handleApplyFilters = (newFilters: ClothingItemFilters) => {
    setFilters(newFilters);
    loadItems(0, true);
  };

  const handleSortPress = () => {
    // Toggle sort direction or cycle through sort fields
    if (sort.field === 'created_at') {
      setSort({ field: 'name', direction: 'asc' });
    } else if (sort.field === 'name') {
      setSort({ field: 'wear_count', direction: 'desc' });
    } else if (sort.field === 'wear_count') {
      setSort({ field: 'last_worn', direction: 'desc' });
    } else {
      setSort({ field: 'created_at', direction: 'desc' });
    }
  };

  const getSortDisplayText = () => {
    switch (sort.field) {
      case 'name':
        return 'Name';
      case 'wear_count':
        return 'Most Worn';
      case 'last_worn':
        return 'Recently Worn';
      default:
        return 'Newest';
    }
  };

  const hasActiveFilters = Object.keys(filters).some(key => filters[key as keyof ClothingItemFilters] !== undefined);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Wardrobe</Text>
        <Text style={styles.subtitle}>{filteredItems.length} items</Text>
      </View>

      {/* Search and Controls */}
      <View style={styles.controls}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            placeholderTextColor={colors.inputPlaceholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          <Text style={styles.searchIcon}>🔍</Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.controlButton, hasActiveFilters && styles.activeFilter]}
            onPress={handleFilterPress}
          >
            <Text style={[styles.controlButtonText, hasActiveFilters && styles.activeFilterText]}>
              Filter
            </Text>
            {hasActiveFilters && <View style={styles.filterDot} />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={handleSortPress}>
            <Text style={styles.controlButtonText}>{getSortDisplayText()}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            <Text style={styles.controlButtonText}>
              {viewMode === 'grid' ? '☰' : '⊞'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Items List/Grid */}
      <View style={styles.content}>
        {viewMode === 'grid' ? (
          <ItemGrid
            items={filteredItems}
            onItemPress={handleItemPress}
            onItemEdit={handleItemEdit}
            onItemDelete={handleItemDelete}
            onToggleFavorite={handleToggleFavorite}
            onMarkWorn={handleMarkWorn}
            onRefresh={handleRefresh}
            onLoadMore={handleLoadMore}
            isLoading={isLoading}
            isRefreshing={isRefreshing}
            hasMore={hasMore}
            emptyMessage={
              searchQuery || hasActiveFilters
                ? 'No items match your search or filters'
                : 'Add your first clothing item to get started!'
            }
          />
        ) : (
          <ItemList
            items={filteredItems}
            onItemPress={handleItemPress}
            onItemEdit={handleItemEdit}
            onItemDelete={handleItemDelete}
            onToggleFavorite={handleToggleFavorite}
            onMarkWorn={handleMarkWorn}
            onRefresh={handleRefresh}
            onLoadMore={handleLoadMore}
            isLoading={isLoading}
            isRefreshing={isRefreshing}
            hasMore={hasMore}
            emptyMessage={
              searchQuery || hasActiveFilters
                ? 'No items match your search or filters'
                : 'Add your first clothing item to get started!'
            }
          />
        )}
      </View>

      {/* Floating Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>

      {/* Filter Modal */}
      <FilterModal
        visible={isFilterModalVisible}
        currentFilters={filters}
        onApplyFilters={handleApplyFilters}
        onClose={() => setIsFilterModalVisible(false)}
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
    padding: dimensions.containerPadding.horizontal,
    paddingBottom: dimensions.spacing.md,
  },
  title: {
    fontSize: dimensions.fontSize.xxxl,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: dimensions.fontSize.md,
    color: colors.textSecondary,
  },
  controls: {
    paddingHorizontal: dimensions.containerPadding.horizontal,
    paddingBottom: dimensions.spacing.md,
  },
  searchContainer: {
    position: 'relative' as const,
    marginBottom: dimensions.spacing.md,
  },
  searchInput: {
    height: dimensions.inputHeight.md,
    backgroundColor: colors.inputBackground,
    borderRadius: dimensions.borderRadius.md,
    paddingHorizontal: dimensions.spacing.md,
    paddingRight: 50,
    fontSize: dimensions.fontSize.md,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  searchIcon: {
    position: 'absolute' as const,
    right: 15,
    top: 14,
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row' as const,
    gap: dimensions.spacing.sm,
  },
  controlButton: {
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    backgroundColor: colors.gray200,
    borderRadius: dimensions.borderRadius.md,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    position: 'relative' as const,
  },
  activeFilter: {
    backgroundColor: colors.primary,
  },
  controlButtonText: {
    fontSize: dimensions.fontSize.sm,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  activeFilterText: {
    color: colors.white,
  },
  filterDot: {
    width: 6,
    height: 6,
    backgroundColor: colors.white,
    borderRadius: 3,
    marginLeft: 4,
  },
  content: {
    flex: 1,
  },
  addButton: {
    position: 'absolute' as const,
    bottom: dimensions.spacing.xxl,
    right: dimensions.spacing.xl,
    width: 56,
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 28,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonText: {
    fontSize: 28,
    color: colors.white,
    fontWeight: '300' as const,
    lineHeight: 28,
  },
};