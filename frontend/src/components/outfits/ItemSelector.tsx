import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native';
import { ClothingItem, ClothingCategory } from '../../types';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';

interface ItemSelectorProps {
  items: ClothingItem[];
  selectedItems: ClothingItem[];
  onSelectionChange: (selectedItems: ClothingItem[]) => void;
  maxSelections?: number;
  categories?: ClothingCategory[];
  searchPlaceholder?: string;
}

export const ItemSelector: React.FC<ItemSelectorProps> = ({
  items,
  selectedItems,
  onSelectionChange,
  maxSelections,
  categories,
  searchPlaceholder = 'Search clothing items...',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ClothingCategory | 'all'>('all');

  const availableCategories = useMemo(() => {
    if (categories) return categories;

    const uniqueCategories = Array.from(
      new Set((items || []).map(item => item.category))
    ).sort();

    return uniqueCategories;
  }, [items, categories]);

  const filteredItems = useMemo(() => {
    let filtered = items || [];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.brand?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [items, selectedCategory, searchQuery]);

  const isItemSelected = (item: ClothingItem) => {
    return selectedItems.some(selected => selected.id === item.id);
  };

  const handleItemToggle = (item: ClothingItem) => {
    const isSelected = isItemSelected(item);

    if (isSelected) {
      // Remove from selection
      const newSelection = selectedItems.filter(selected => selected.id !== item.id);
      onSelectionChange(newSelection);
    } else {
      // Add to selection (if not at max)
      if (maxSelections && selectedItems.length >= maxSelections) {
        return; // Don't add if at max
      }
      const newSelection = [...selectedItems, item];
      onSelectionChange(newSelection);
    }
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  const getCategoryDisplayName = (category: ClothingCategory) => {
    return category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ');
  };

  const renderSelectionCounter = () => {
    const count = selectedItems.length;
    const maxText = maxSelections ? ` / ${maxSelections}` : '';

    return (
      <View style={styles.selectionCounter}>
        <Text style={styles.selectionCounterText}>
          {count} selected{maxText}
        </Text>
        {count > 0 && (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearAllButton}>
            <Text style={styles.clearAllButtonText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderCategoryTabs = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.categoryTabs}
      contentContainerStyle={styles.categoryTabsContent}
    >
      <TouchableOpacity
        style={[
          styles.categoryTab,
          selectedCategory === 'all' && styles.selectedCategoryTab,
        ]}
        onPress={() => setSelectedCategory('all')}
      >
        <Text style={[
          styles.categoryTabText,
          selectedCategory === 'all' && styles.selectedCategoryTabText,
        ]}>
          All
        </Text>
      </TouchableOpacity>

      {availableCategories.map(category => (
        <TouchableOpacity
          key={category}
          style={[
            styles.categoryTab,
            selectedCategory === category && styles.selectedCategoryTab,
          ]}
          onPress={() => setSelectedCategory(category)}
        >
          <Text style={[
            styles.categoryTabText,
            selectedCategory === category && styles.selectedCategoryTabText,
          ]}>
            {getCategoryDisplayName(category)}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderItem = (item: ClothingItem) => {
    const isSelected = isItemSelected(item);
    const isDisabled = maxSelections && !isSelected && selectedItems.length >= maxSelections;
    const primaryImage = item.image_urls[0];

    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.itemCard,
          isSelected && styles.selectedItemCard,
          isDisabled && styles.disabledItemCard,
        ]}
        onPress={() => handleItemToggle(item)}
        disabled={isDisabled}
        activeOpacity={0.7}
      >
        <View style={styles.itemImageContainer}>
          {primaryImage ? (
            <Image
              source={{ uri: primaryImage }}
              style={styles.itemImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>👔</Text>
            </View>
          )}

          {/* Selection indicator */}
          <View style={[
            styles.selectionIndicator,
            isSelected && styles.selectedIndicator,
          ]}>
            {isSelected && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </View>

          {/* Favorite indicator */}
          {item.is_favorite && (
            <View style={styles.favoriteIndicator}>
              <Text style={styles.favoriteIcon}>❤️</Text>
            </View>
          )}
        </View>

        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.name}
          </Text>

          <Text style={styles.itemDetails} numberOfLines={1}>
            {getCategoryDisplayName(item.category)}
            {item.brand && ` • ${item.brand}`}
            {item.size && ` • ${item.size}`}
          </Text>

          {item.tags.length > 0 && (
            <View style={styles.itemTags}>
              {item.tags.slice(0, 2).map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
              {item.tags.length > 2 && (
                <Text style={styles.moreTagsText}>+{item.tags.length - 2}</Text>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with selection counter */}
      {renderSelectionCounter()}

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={searchPlaceholder}
          placeholderTextColor={colors.inputPlaceholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearSearchButton}
            onPress={() => setSearchQuery('')}
          >
            <Text style={styles.clearSearchText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category tabs */}
      {renderCategoryTabs()}

      {/* Items grid */}
      <ScrollView
        style={styles.itemsContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.itemsContent}
      >
        {filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No items found</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery ? 'Try adjusting your search' : 'Add some clothing items to your wardrobe first'}
            </Text>
          </View>
        ) : (
          <View style={styles.itemsGrid}>
            {filteredItems.map(renderItem)}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  selectionCounter: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: dimensions.containerPadding.horizontal,
    paddingVertical: dimensions.spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectionCounterText: {
    fontSize: dimensions.fontSize.md,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  clearAllButton: {
    paddingHorizontal: dimensions.spacing.sm,
    paddingVertical: dimensions.spacing.xs,
  },
  clearAllButtonText: {
    fontSize: dimensions.fontSize.sm,
    color: colors.primary,
    fontWeight: '600' as const,
  },
  searchContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: dimensions.containerPadding.horizontal,
    paddingVertical: dimensions.spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    flex: 1,
    height: dimensions.inputHeight.sm,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: dimensions.borderRadius.md,
    paddingHorizontal: dimensions.spacing.md,
    fontSize: dimensions.fontSize.sm,
    backgroundColor: colors.inputBackground,
    color: colors.textPrimary,
  },
  clearSearchButton: {
    marginLeft: dimensions.spacing.sm,
    padding: dimensions.spacing.xs,
  },
  clearSearchText: {
    fontSize: dimensions.fontSize.md,
    color: colors.textSecondary,
  },
  categoryTabs: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    maxHeight: 32,
  },
  categoryTabsContent: {
    paddingHorizontal: dimensions.containerPadding.horizontal,
    paddingVertical: 4,
  },
  categoryTab: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    borderRadius: 4,
    backgroundColor: colors.gray100,
  },
  selectedCategoryTab: {
    backgroundColor: colors.primary,
  },
  categoryTabText: {
    fontSize: dimensions.fontSize.xs,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    lineHeight: 14,
  },
  selectedCategoryTabText: {
    color: colors.white,
  },
  itemsContainer: {
    flex: 1,
  },
  itemsContent: {
    padding: dimensions.containerPadding.horizontal,
  },
  itemsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'space-between' as const,
  },
  itemCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.md,
    marginBottom: dimensions.spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedItemCard: {
    borderColor: colors.primary,
  },
  disabledItemCard: {
    opacity: 0.5,
  },
  itemImageContainer: {
    position: 'relative' as const,
  },
  itemImage: {
    width: '100%',
    aspectRatio: 1,
    borderTopLeftRadius: dimensions.borderRadius.md,
    borderTopRightRadius: dimensions.borderRadius.md,
    backgroundColor: colors.gray100,
  },
  placeholderImage: {
    width: '100%',
    aspectRatio: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.gray100,
    borderTopLeftRadius: dimensions.borderRadius.md,
    borderTopRightRadius: dimensions.borderRadius.md,
  },
  placeholderText: {
    fontSize: 24,
  },
  selectionIndicator: {
    position: 'absolute' as const,
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.gray300,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  selectedIndicator: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold' as const,
  },
  favoriteIndicator: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
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
  itemInfo: {
    padding: dimensions.spacing.sm,
  },
  itemName: {
    fontSize: dimensions.fontSize.sm,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: dimensions.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: dimensions.spacing.xs,
  },
  itemTags: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 4,
  },
  tag: {
    backgroundColor: colors.primary + '20',
    borderRadius: dimensions.borderRadius.xs,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 9,
    color: colors.primary,
    fontWeight: '500' as const,
  },
  moreTagsText: {
    fontSize: 9,
    color: colors.textSecondary,
    fontStyle: 'italic' as const,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingTop: dimensions.spacing.xxxl,
  },
  emptyStateTitle: {
    fontSize: dimensions.fontSize.lg,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
  },
  emptyStateText: {
    fontSize: dimensions.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center' as const,
  },
};