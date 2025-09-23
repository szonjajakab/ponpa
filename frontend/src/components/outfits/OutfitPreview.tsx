import React, { useMemo } from 'react';
import { View, Text, Image, ScrollView, Dimensions } from 'react-native';
import { ClothingItem, ClothingCategory, OutfitItemPosition } from '../../types';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';

interface OutfitPreviewProps {
  items: ClothingItem[];
  itemPositions?: OutfitItemPosition[];
  size?: 'small' | 'medium' | 'large';
  showItemNames?: boolean;
  interactive?: boolean;
}

export const OutfitPreview: React.FC<OutfitPreviewProps> = ({
  items,
  itemPositions,
  size = 'medium',
  showItemNames = false,
  interactive = false,
}) => {
  const screenWidth = Dimensions.get('window').width;

  // Define layer priorities for different clothing categories
  const getLayerPriority = (category: ClothingCategory): number => {
    switch (category) {
      case ClothingCategory.UNDERWEAR:
        return 0; // Bottom layer
      case ClothingCategory.BOTTOMS:
        return 1;
      case ClothingCategory.TOPS:
        return 2;
      case ClothingCategory.DRESSES:
        return 2; // Same level as tops
      case ClothingCategory.OUTERWEAR:
        return 3;
      case ClothingCategory.SHOES:
        return 4;
      case ClothingCategory.ACCESSORIES:
        return 5; // Top layer
      default:
        return 1;
    }
  };

  // Calculate preview dimensions based on size
  const getPreviewDimensions = () => {
    switch (size) {
      case 'small':
        return {
          width: Math.min(screenWidth * 0.4, 150),
          height: Math.min(screenWidth * 0.5, 200),
        };
      case 'large':
        return {
          width: Math.min(screenWidth * 0.8, 300),
          height: Math.min(screenWidth * 1.0, 400),
        };
      case 'medium':
      default:
        return {
          width: Math.min(screenWidth * 0.6, 220),
          height: Math.min(screenWidth * 0.75, 280),
        };
    }
  };

  const previewDims = getPreviewDimensions();

  // Sort items by layer priority for proper layering
  const layeredItems = useMemo(() => {
    return [...items]
      .map((item, index) => ({
        item,
        layer: itemPositions?.find(pos => pos.itemId === item.id)?.layer ?? getLayerPriority(item.category),
        position: itemPositions?.find(pos => pos.itemId === item.id)?.position,
      }))
      .sort((a, b) => a.layer - b.layer);
  }, [items, itemPositions]);

  // Calculate item positioning within the preview
  const getItemStyle = (item: ClothingItem, layer: number, position?: { x: number; y: number }) => {
    const baseStyle = {
      position: 'absolute' as const,
      zIndex: layer,
      borderRadius: dimensions.borderRadius.sm,
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.border + '40',
    };

    // If custom position is provided, use it
    if (position) {
      return {
        ...baseStyle,
        left: position.x,
        top: position.y,
        width: previewDims.width * 0.6,
        height: previewDims.height * 0.6,
      };
    }

    // Default positioning based on category
    switch (item.category) {
      case ClothingCategory.TOPS:
      case ClothingCategory.DRESSES:
        return {
          ...baseStyle,
          top: previewDims.height * 0.1,
          left: previewDims.width * 0.15,
          width: previewDims.width * 0.7,
          height: previewDims.height * 0.6,
        };

      case ClothingCategory.BOTTOMS:
        return {
          ...baseStyle,
          top: previewDims.height * 0.45,
          left: previewDims.width * 0.2,
          width: previewDims.width * 0.6,
          height: previewDims.height * 0.5,
        };

      case ClothingCategory.OUTERWEAR:
        return {
          ...baseStyle,
          top: previewDims.height * 0.05,
          left: previewDims.width * 0.1,
          width: previewDims.width * 0.8,
          height: previewDims.height * 0.7,
        };

      case ClothingCategory.SHOES:
        return {
          ...baseStyle,
          bottom: 10,
          left: previewDims.width * 0.25,
          width: previewDims.width * 0.5,
          height: previewDims.height * 0.2,
        };

      case ClothingCategory.ACCESSORIES:
        return {
          ...baseStyle,
          top: previewDims.height * 0.02,
          right: previewDims.width * 0.05,
          width: previewDims.width * 0.3,
          height: previewDims.width * 0.3,
        };

      default:
        return {
          ...baseStyle,
          top: previewDims.height * 0.2,
          left: previewDims.width * 0.2,
          width: previewDims.width * 0.6,
          height: previewDims.height * 0.6,
        };
    }
  };

  const renderPreviewItem = (layeredItem: { item: ClothingItem; layer: number; position?: { x: number; y: number } }, index: number) => {
    const { item, layer, position } = layeredItem;
    const itemStyle = getItemStyle(item, layer, position);
    const primaryImage = item.image_urls[0];

    return (
      <View key={`${item.id}-${index}`} style={itemStyle}>
        {primaryImage ? (
          <Image
            source={{ uri: primaryImage }}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: dimensions.borderRadius.sm,
            }}
            resizeMode="cover"
          />
        ) : (
          <View style={{
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: colors.gray100,
            borderRadius: dimensions.borderRadius.sm,
          }}>
            <Text style={{ fontSize: size === 'small' ? 16 : size === 'large' ? 32 : 24 }}>
              👔
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderItemNames = () => {
    if (!showItemNames || items.length === 0) return null;

    return (
      <View style={styles.itemNamesList}>
        <Text style={styles.itemNamesTitle}>Items in this outfit:</Text>
        {items.map((item, index) => (
          <Text key={item.id} style={styles.itemNameText}>
            • {item.name}
          </Text>
        ))}
      </View>
    );
  };

  if (items.length === 0) {
    return (
      <View style={[
        styles.emptyPreview,
        {
          width: previewDims.width,
          height: previewDims.height,
        }
      ]}>
        <Text style={styles.emptyPreviewText}>
          👗
        </Text>
        <Text style={styles.emptyPreviewSubtext}>
          No items selected
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[
        styles.previewContainer,
        {
          width: previewDims.width,
          height: previewDims.height,
        }
      ]}>
        {/* Background/mannequin outline */}
        <View style={[styles.mannequinOutline, {
          width: previewDims.width,
          height: previewDims.height,
        }]} />

        {/* Render layered items */}
        {layeredItems.map(renderPreviewItem)}

        {/* Item count indicator */}
        <View style={styles.itemCount}>
          <Text style={styles.itemCountText}>{items.length}</Text>
        </View>
      </View>

      {/* Item names list */}
      {renderItemNames()}
    </View>
  );
};

const styles = {
  container: {
    alignItems: 'center' as const,
  },
  previewContainer: {
    position: 'relative' as const,
    backgroundColor: colors.background,
    borderRadius: dimensions.borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed' as const,
    overflow: 'hidden' as const,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mannequinOutline: {
    position: 'absolute' as const,
    borderRadius: dimensions.borderRadius.lg,
    backgroundColor: colors.gray50,
  },
  emptyPreview: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.gray50,
    borderRadius: dimensions.borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed' as const,
  },
  emptyPreviewText: {
    fontSize: 48,
    marginBottom: dimensions.spacing.sm,
  },
  emptyPreviewSubtext: {
    fontSize: dimensions.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center' as const,
  },
  itemCount: {
    position: 'absolute' as const,
    top: 8,
    left: 8,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  itemCountText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  itemNamesList: {
    marginTop: dimensions.spacing.md,
    paddingHorizontal: dimensions.spacing.sm,
    maxWidth: 250,
  },
  itemNamesTitle: {
    fontSize: dimensions.fontSize.sm,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.xs,
  },
  itemNameText: {
    fontSize: dimensions.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
};