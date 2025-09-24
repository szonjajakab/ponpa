import React from 'react';
import { FlatList, View, Text, RefreshControl } from 'react-native';
import { ClothingItem } from '../../types';
import { ItemCard } from './ItemCard';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';

interface ItemGridProps {
  items: ClothingItem[];
  onItemPress: (item: ClothingItem) => void;
  onItemEdit?: (item: ClothingItem) => void;
  onItemDelete?: (item: ClothingItem) => void;
  onToggleFavorite?: (item: ClothingItem) => void;
  onMarkWorn?: (item: ClothingItem) => void;
  onRefresh?: () => void;
  onLoadMore?: () => void;
  isLoading?: boolean;
  isRefreshing?: boolean;
  hasMore?: boolean;
  emptyMessage?: string;
  numColumns?: number;
}

export const ItemGrid: React.FC<ItemGridProps> = ({
  items,
  onItemPress,
  onItemEdit,
  onItemDelete,
  onToggleFavorite,
  onMarkWorn,
  onRefresh,
  onLoadMore,
  isLoading = false,
  isRefreshing = false,
  hasMore = false,
  emptyMessage = 'No items found',
  numColumns = 2,
}) => {
  const renderItem = ({ item }: { item: ClothingItem }) => (
    <View style={[styles.itemContainer, { flex: 1, maxWidth: `${100 / numColumns}%` }]}>
      <ItemCard
        item={item}
        onPress={onItemPress}
        onEdit={onItemEdit}
        onDelete={onItemDelete}
        onToggleFavorite={onToggleFavorite}
        onMarkWorn={onMarkWorn}
        viewMode="grid"
      />
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>👔</Text>
      <Text style={styles.emptyTitle}>No Clothing Items</Text>
      <Text style={styles.emptyMessage}>{emptyMessage}</Text>
    </View>
  );

  const renderFooter = () => {
    if (!isLoading) return null;

    return (
      <View style={styles.footerContainer}>
        <Text style={styles.loadingText}>Loading more items...</Text>
      </View>
    );
  };

  const handleEndReached = () => {
    if (!isLoading && hasMore && onLoadMore) {
      onLoadMore();
    }
  };

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      numColumns={numColumns}
      contentContainerStyle={[
        styles.container,
        items.length === 0 && styles.emptyContentContainer,
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        ) : undefined
      }
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.1}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={renderFooter}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={10}
      windowSize={10}
    />
  );
};

const styles = {
  container: {
    padding: dimensions.containerPadding.horizontal,
    paddingTop: dimensions.spacing.md,
  },
  emptyContentContainer: {
    flexGrow: 1,
    justifyContent: 'center' as const,
  },
  itemContainer: {
    paddingHorizontal: dimensions.spacing.xs,
    marginBottom: dimensions.spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingVertical: dimensions.spacing.xxxl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: dimensions.spacing.lg,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: dimensions.fontSize.xl,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
    textAlign: 'center' as const,
  },
  emptyMessage: {
    fontSize: dimensions.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 20,
  },
  footerContainer: {
    paddingVertical: dimensions.spacing.lg,
    alignItems: 'center' as const,
  },
  loadingText: {
    fontSize: dimensions.fontSize.sm,
    color: colors.textSecondary,
  },
};