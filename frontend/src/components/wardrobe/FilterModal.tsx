import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
} from 'react-native';
import { ClothingItemFilters, ClothingCategory, ClothingSize } from '../../types';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';

interface FilterModalProps {
  visible: boolean;
  currentFilters: ClothingItemFilters;
  onApplyFilters: (filters: ClothingItemFilters) => void;
  onClose: () => void;
}

const CATEGORY_OPTIONS = [
  { value: ClothingCategory.TOPS, label: 'Tops' },
  { value: ClothingCategory.BOTTOMS, label: 'Bottoms' },
  { value: ClothingCategory.DRESSES, label: 'Dresses' },
  { value: ClothingCategory.OUTERWEAR, label: 'Outerwear' },
  { value: ClothingCategory.SHOES, label: 'Shoes' },
  { value: ClothingCategory.ACCESSORIES, label: 'Accessories' },
  { value: ClothingCategory.UNDERWEAR, label: 'Underwear' },
  { value: ClothingCategory.ACTIVEWEAR, label: 'Activewear' },
  { value: ClothingCategory.FORMAL, label: 'Formal' },
  { value: ClothingCategory.CASUAL, label: 'Casual' },
];

const SIZE_OPTIONS = [
  { value: ClothingSize.XS, label: 'XS' },
  { value: ClothingSize.S, label: 'S' },
  { value: ClothingSize.M, label: 'M' },
  { value: ClothingSize.L, label: 'L' },
  { value: ClothingSize.XL, label: 'XL' },
  { value: ClothingSize.XXL, label: 'XXL' },
  { value: ClothingSize.XXXL, label: 'XXXL' },
  { value: ClothingSize.SIZE_0, label: '0' },
  { value: ClothingSize.SIZE_2, label: '2' },
  { value: ClothingSize.SIZE_4, label: '4' },
  { value: ClothingSize.SIZE_6, label: '6' },
  { value: ClothingSize.SIZE_8, label: '8' },
  { value: ClothingSize.SIZE_10, label: '10' },
  { value: ClothingSize.SIZE_12, label: '12' },
  { value: ClothingSize.SIZE_14, label: '14' },
  { value: ClothingSize.SIZE_16, label: '16' },
  { value: ClothingSize.SIZE_18, label: '18' },
  { value: ClothingSize.SIZE_20, label: '20' },
];

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  currentFilters,
  onApplyFilters,
  onClose,
}) => {
  const [filters, setFilters] = useState<ClothingItemFilters>(currentFilters);

  const handleCategoryToggle = (category: ClothingCategory) => {
    setFilters(prev => ({
      ...prev,
      category: prev.category === category ? undefined : category,
    }));
  };

  const handleSizeToggle = (size: ClothingSize) => {
    setFilters(prev => ({
      ...prev,
      size: prev.size === size ? undefined : size,
    }));
  };

  const handleFavoriteToggle = (value: boolean) => {
    setFilters(prev => ({
      ...prev,
      is_favorite: value,
    }));
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handleApplyFilters = () => {
    onApplyFilters(filters);
    onClose();
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.category) count++;
    if (filters.size) count++;
    if (filters.is_favorite !== undefined) count++;
    if (filters.brand) count++;
    return count;
  };

  const hasActiveFilters = getActiveFiltersCount() > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.title}>Filter Items</Text>
            {hasActiveFilters && (
              <Text style={styles.subtitle}>
                {getActiveFiltersCount()} filter{getActiveFiltersCount() !== 1 ? 's' : ''} active
              </Text>
            )}
          </View>

          <TouchableOpacity onPress={handleApplyFilters}>
            <Text style={styles.applyText}>Apply</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Favorites Filter */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Favorites</Text>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Show only favorites</Text>
              <Switch
                value={filters.is_favorite === true}
                onValueChange={handleFavoriteToggle}
                trackColor={{ false: colors.gray300, true: colors.primary + '40' }}
                thumbColor={filters.is_favorite === true ? colors.primary : colors.gray400}
              />
            </View>
          </View>

          {/* Category Filter */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category</Text>
            <View style={styles.optionsContainer}>
              {CATEGORY_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    filters.category === option.value && styles.selectedOption,
                  ]}
                  onPress={() => handleCategoryToggle(option.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      filters.category === option.value && styles.selectedOptionText,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {filters.category && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setFilters(prev => ({ ...prev, category: undefined }))}
              >
                <Text style={styles.clearButtonText}>Clear Category</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Size Filter */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Size</Text>
            <View style={styles.optionsContainer}>
              {SIZE_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    filters.size === option.value && styles.selectedOption,
                  ]}
                  onPress={() => handleSizeToggle(option.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      filters.size === option.value && styles.selectedOptionText,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {filters.size && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setFilters(prev => ({ ...prev, size: undefined }))}
              >
                <Text style={styles.clearButtonText}>Clear Size</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Clear All Filters */}
          {hasActiveFilters && (
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.clearAllButton}
                onPress={handleClearFilters}
              >
                <Text style={styles.clearAllButtonText}>Clear All Filters</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleClearFilters}
          >
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.applyButton}
            onPress={handleApplyFilters}
          >
            <Text style={styles.applyButtonText}>
              Apply Filters
              {hasActiveFilters && ` (${getActiveFiltersCount()})`}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cancelText: {
    fontSize: dimensions.fontSize.md,
    color: colors.textSecondary,
  },
  headerCenter: {
    alignItems: 'center' as const,
  },
  title: {
    fontSize: dimensions.fontSize.lg,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: dimensions.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  applyText: {
    fontSize: dimensions.fontSize.md,
    color: colors.primary,
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
    padding: dimensions.containerPadding.horizontal,
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
  switchContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingVertical: dimensions.spacing.sm,
  },
  switchLabel: {
    fontSize: dimensions.fontSize.md,
    color: colors.textPrimary,
  },
  optionsContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: dimensions.spacing.sm,
    marginBottom: dimensions.spacing.md,
  },
  optionButton: {
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: dimensions.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  selectedOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: dimensions.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: '500' as const,
  },
  selectedOptionText: {
    color: colors.white,
  },
  clearButton: {
    alignSelf: 'flex-start' as const,
  },
  clearButtonText: {
    fontSize: dimensions.fontSize.sm,
    color: colors.primary,
    fontWeight: '500' as const,
  },
  clearAllButton: {
    paddingVertical: dimensions.spacing.md,
    paddingHorizontal: dimensions.spacing.lg,
    backgroundColor: colors.gray100,
    borderRadius: dimensions.borderRadius.md,
    alignItems: 'center' as const,
  },
  clearAllButtonText: {
    fontSize: dimensions.fontSize.md,
    color: colors.textPrimary,
    fontWeight: '600' as const,
  },
  bottomActions: {
    flexDirection: 'row' as const,
    gap: dimensions.spacing.md,
    padding: dimensions.containerPadding.horizontal,
    paddingBottom: dimensions.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  resetButton: {
    flex: 1,
    paddingVertical: dimensions.spacing.md,
    backgroundColor: colors.gray200,
    borderRadius: dimensions.borderRadius.md,
    alignItems: 'center' as const,
  },
  resetButtonText: {
    fontSize: dimensions.fontSize.md,
    color: colors.textPrimary,
    fontWeight: '600' as const,
  },
  applyButton: {
    flex: 2,
    paddingVertical: dimensions.spacing.md,
    backgroundColor: colors.primary,
    borderRadius: dimensions.borderRadius.md,
    alignItems: 'center' as const,
  },
  applyButtonText: {
    fontSize: dimensions.fontSize.md,
    color: colors.white,
    fontWeight: '600' as const,
  },
};