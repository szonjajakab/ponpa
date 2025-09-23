import React, { useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { OutfitStackParamList, OutfitFilters, OutfitSort } from '../../types';
import { TagSelector } from '../../components/common/TagSelector';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';

type OutfitFilterModalNavigationProp = StackNavigationProp<OutfitStackParamList, 'OutfitFilterModal'>;
type OutfitFilterModalRouteProp = RouteProp<OutfitStackParamList, 'OutfitFilterModal'>;

interface OutfitFilterModalProps {
  navigation: OutfitFilterModalNavigationProp;
  route: OutfitFilterModalRouteProp;
}

export const OutfitFilterModal: React.FC<OutfitFilterModalProps> = ({
  navigation,
  route,
}) => {
  const { currentFilters, onApplyFilters } = route.params;
  const [filters, setFilters] = useState<OutfitFilters>(currentFilters || {});
  const [sort, setSort] = useState<OutfitSort>({ field: 'updated_at', direction: 'desc' });

  const updateFilter = (key: keyof OutfitFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const applyFilters = () => {
    onApplyFilters(filters);
    navigation.goBack();
  };

  const hasActiveFilters = Object.keys(filters).some(key =>
    filters[key as keyof OutfitFilters] !== undefined &&
    filters[key as keyof OutfitFilters] !== ''
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Filter Outfits</Text>
        <TouchableOpacity onPress={applyFilters}>
          <Text style={styles.applyButton}>Apply</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Favorites Filter */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Favorites</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                filters.is_favorite === true && styles.toggleButtonActive,
              ]}
              onPress={() => updateFilter('is_favorite', filters.is_favorite === true ? undefined : true)}
            >
              <Text style={[
                styles.toggleButtonText,
                filters.is_favorite === true && styles.toggleButtonTextActive,
              ]}>
                ⭐ Favorites Only
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Occasion Filter */}
        <View style={styles.section}>
          <TagSelector
            type="occasion"
            title="Occasion"
            selectedValue={filters.occasion}
            onSelectionChange={(value) => updateFilter('occasion', value)}
            placeholder="Filter by occasion"
          />
        </View>

        {/* Season Filter */}
        <View style={styles.section}>
          <TagSelector
            type="season"
            title="Season"
            selectedValue={filters.season}
            onSelectionChange={(value) => updateFilter('season', value)}
            placeholder="Filter by season"
          />
        </View>

        {/* Weather Filter */}
        <View style={styles.section}>
          <TagSelector
            type="weather"
            title="Weather"
            selectedValue={filters.weather}
            onSelectionChange={(value) => updateFilter('weather', value)}
            placeholder="Filter by weather"
          />
        </View>

        {/* Tags Filter */}
        <View style={styles.section}>
          <TagSelector
            type="custom"
            title="Tags"
            selectedTags={filters.tags}
            onTagsChange={(tags) => updateFilter('tags', tags)}
            multiSelect={true}
            placeholder="Filter by tags"
          />
        </View>

        {/* Sort Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sort By</Text>
          <View style={styles.sortOptions}>
            {[
              { field: 'updated_at', label: 'Recently Updated' },
              { field: 'created_at', label: 'Date Created' },
              { field: 'name', label: 'Name' },
              { field: 'wear_count', label: 'Times Worn' },
              { field: 'last_worn', label: 'Last Worn' },
            ].map((option) => (
              <TouchableOpacity
                key={option.field}
                style={[
                  styles.sortOption,
                  sort.field === option.field && styles.sortOptionActive,
                ]}
                onPress={() => setSort(prev => ({ ...prev, field: option.field as any }))}
              >
                <Text style={[
                  styles.sortOptionText,
                  sort.field === option.field && styles.sortOptionTextActive,
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.sortDirection}>
            <TouchableOpacity
              style={[
                styles.directionButton,
                sort.direction === 'desc' && styles.directionButtonActive,
              ]}
              onPress={() => setSort(prev => ({ ...prev, direction: 'desc' }))}
            >
              <Text style={[
                styles.directionButtonText,
                sort.direction === 'desc' && styles.directionButtonTextActive,
              ]}>
                Newest First
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.directionButton,
                sort.direction === 'asc' && styles.directionButtonActive,
              ]}
              onPress={() => setSort(prev => ({ ...prev, direction: 'asc' }))}
            >
              <Text style={[
                styles.directionButtonText,
                sort.direction === 'asc' && styles.directionButtonTextActive,
              ]}>
                Oldest First
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {hasActiveFilters && (
          <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
            <Text style={styles.clearButtonText}>Clear All Filters</Text>
          </TouchableOpacity>
        )}
      </View>
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
  cancelButton: {
    fontSize: dimensions.fontSize.md,
    color: colors.textSecondary,
    fontWeight: '500' as const,
  },
  title: {
    fontSize: dimensions.fontSize.lg,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  applyButton: {
    fontSize: dimensions.fontSize.md,
    color: colors.primary,
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
    paddingHorizontal: dimensions.containerPadding.horizontal,
  },
  section: {
    marginVertical: dimensions.spacing.lg,
  },
  sectionTitle: {
    fontSize: dimensions.fontSize.md,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row' as const,
  },
  toggleButton: {
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: dimensions.borderRadius.md,
    backgroundColor: colors.white,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toggleButtonText: {
    fontSize: dimensions.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: '500' as const,
  },
  toggleButtonTextActive: {
    color: colors.white,
  },
  sortOptions: {
    marginBottom: dimensions.spacing.md,
  },
  sortOption: {
    paddingVertical: dimensions.spacing.sm,
    paddingHorizontal: dimensions.spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: dimensions.borderRadius.md,
    marginBottom: dimensions.spacing.xs,
    backgroundColor: colors.white,
  },
  sortOptionActive: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary,
  },
  sortOptionText: {
    fontSize: dimensions.fontSize.sm,
    color: colors.textPrimary,
  },
  sortOptionTextActive: {
    color: colors.primary,
    fontWeight: '600' as const,
  },
  sortDirection: {
    flexDirection: 'row' as const,
    gap: dimensions.spacing.sm,
  },
  directionButton: {
    flex: 1,
    paddingVertical: dimensions.spacing.sm,
    paddingHorizontal: dimensions.spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: dimensions.borderRadius.md,
    backgroundColor: colors.white,
    alignItems: 'center' as const,
  },
  directionButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  directionButtonText: {
    fontSize: dimensions.fontSize.sm,
    color: colors.textPrimary,
  },
  directionButtonTextActive: {
    color: colors.white,
    fontWeight: '600' as const,
  },
  footer: {
    paddingHorizontal: dimensions.containerPadding.horizontal,
    paddingVertical: dimensions.spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  clearButton: {
    paddingVertical: dimensions.spacing.sm,
    alignItems: 'center' as const,
  },
  clearButtonText: {
    fontSize: dimensions.fontSize.md,
    color: colors.error,
    fontWeight: '500' as const,
  },
};