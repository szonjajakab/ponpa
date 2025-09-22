import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const dimensions = {
  // Screen dimensions
  screenWidth,
  screenHeight,

  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  // Border radius
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 999,
  },

  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },

  // Icon sizes
  iconSize: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  // Button heights
  buttonHeight: {
    sm: 36,
    md: 44,
    lg: 52,
  },

  // Input heights
  inputHeight: {
    sm: 36,
    md: 44,
    lg: 52,
  },

  // Container padding
  containerPadding: {
    horizontal: 16,
    vertical: 24,
  },

  // Header height
  headerHeight: 60,

  // Tab bar height
  tabBarHeight: 80,
};

export type DimensionKey = keyof typeof dimensions;