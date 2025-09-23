import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ItemCard } from '../ItemCard';
import { ClothingItem, ClothingCategory, ClothingSize } from '../../../types';

// Mock react-native-gesture-handler
jest.mock('react-native-gesture-handler', () => ({
  Swipeable: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('ItemCard', () => {
  const mockItem: ClothingItem = {
    id: '1',
    user_uid: 'user1',
    name: 'Blue Jeans',
    category: ClothingCategory.BOTTOMS,
    brand: 'Levi\'s',
    size: ClothingSize.M,
    colors: [{ name: 'Blue', hex_code: '#0000FF' }],
    description: 'Comfortable blue jeans',
    image_urls: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    purchase_date: new Date('2023-01-01'),
    purchase_price: 80,
    tags: ['casual', 'everyday', 'comfortable'],
    is_favorite: false,
    wear_count: 5,
    last_worn: new Date('2023-12-01'),
    condition: 'good',
    notes: 'Great fit',
    created_at: new Date('2023-01-01'),
    updated_at: new Date('2023-12-01'),
  };

  const mockOnPress = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnToggleFavorite = jest.fn();
  const mockOnMarkWorn = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders item information correctly in grid mode', () => {
      const { getByText, getByTestId } = render(
        <ItemCard
          item={mockItem}
          onPress={mockOnPress}
          viewMode="grid"
        />
      );

      expect(getByText('Blue Jeans')).toBeTruthy();
      expect(getByText('Bottoms • Levi\'s • M')).toBeTruthy();
    });

    it('renders item information correctly in list mode', () => {
      const { getByText } = render(
        <ItemCard
          item={mockItem}
          onPress={mockOnPress}
          viewMode="list"
        />
      );

      expect(getByText('Blue Jeans')).toBeTruthy();
      expect(getByText('Bottoms • Levi\'s • M')).toBeTruthy();
      expect(getByText('Worn: 5 times')).toBeTruthy();
      expect(getByText('Last: 12/1/2023')).toBeTruthy();
    });

    it('renders placeholder when no image is available', () => {
      const itemWithoutImage = { ...mockItem, image_urls: [] };
      const { getByText } = render(
        <ItemCard
          item={itemWithoutImage}
          onPress={mockOnPress}
        />
      );

      expect(getByText('👔')).toBeTruthy();
    });

    it('shows favorite indicator when item is favorite', () => {
      const favoriteItem = { ...mockItem, is_favorite: true };
      const { getByText } = render(
        <ItemCard
          item={favoriteItem}
          onPress={mockOnPress}
        />
      );

      expect(getByText('❤️')).toBeTruthy();
    });

    it('shows image count when multiple images exist', () => {
      const { getByText } = render(
        <ItemCard
          item={mockItem}
          onPress={mockOnPress}
        />
      );

      expect(getByText('2')).toBeTruthy();
    });

    it('renders tags correctly', () => {
      const { getByText } = render(
        <ItemCard
          item={mockItem}
          onPress={mockOnPress}
          viewMode="list"
        />
      );

      expect(getByText('casual')).toBeTruthy();
      expect(getByText('everyday')).toBeTruthy();
      expect(getByText('comfortable')).toBeTruthy();
    });

    it('shows limited tags in grid mode with overflow indicator', () => {
      const itemWithManyTags = {
        ...mockItem,
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5']
      };

      const { getByText } = render(
        <ItemCard
          item={itemWithManyTags}
          onPress={mockOnPress}
          viewMode="grid"
        />
      );

      expect(getByText('tag1')).toBeTruthy();
      expect(getByText('tag2')).toBeTruthy();
      expect(getByText('+3')).toBeTruthy();
    });
  });

  describe('Display formatting', () => {
    it('capitalizes category display name', () => {
      const { getByText } = render(
        <ItemCard
          item={mockItem}
          onPress={mockOnPress}
        />
      );

      expect(getByText('Bottoms • Levi\'s • M')).toBeTruthy();
    });

    it('handles missing brand and size gracefully', () => {
      const itemWithoutBrandSize = {
        ...mockItem,
        brand: undefined,
        size: undefined
      };

      const { getByText } = render(
        <ItemCard
          item={itemWithoutBrandSize}
          onPress={mockOnPress}
        />
      );

      expect(getByText('Bottoms')).toBeTruthy();
    });

    it('formats date correctly in list mode', () => {
      const itemWithLastWorn = {
        ...mockItem,
        last_worn: new Date('2023-06-15')
      };

      const { getByText } = render(
        <ItemCard
          item={itemWithLastWorn}
          onPress={mockOnPress}
          viewMode="list"
        />
      );

      expect(getByText('Last: 6/15/2023')).toBeTruthy();
    });
  });

  describe('Interactions', () => {
    it('calls onPress when card is pressed', () => {
      const { getByText } = render(
        <ItemCard
          item={mockItem}
          onPress={mockOnPress}
        />
      );

      fireEvent.press(getByText('Blue Jeans'));

      expect(mockOnPress).toHaveBeenCalledWith(mockItem);
    });

    it('calls onEdit when edit action is pressed', () => {
      const { getByText } = render(
        <ItemCard
          item={mockItem}
          onPress={mockOnPress}
          onEdit={mockOnEdit}
        />
      );

      fireEvent.press(getByText('Edit'));

      expect(mockOnEdit).toHaveBeenCalledWith(mockItem);
    });

    it('calls onToggleFavorite when favorite action is pressed', () => {
      const { getByText } = render(
        <ItemCard
          item={mockItem}
          onPress={mockOnPress}
          onToggleFavorite={mockOnToggleFavorite}
        />
      );

      fireEvent.press(getByText('Favorite'));

      expect(mockOnToggleFavorite).toHaveBeenCalledWith(mockItem);
    });

    it('shows correct favorite action text for favorite items', () => {
      const favoriteItem = { ...mockItem, is_favorite: true };
      const { getByText } = render(
        <ItemCard
          item={favoriteItem}
          onPress={mockOnPress}
          onToggleFavorite={mockOnToggleFavorite}
        />
      );

      expect(getByText('Unfav')).toBeTruthy();
    });
  });

  describe('Alert dialogs', () => {
    it('shows delete confirmation alert when delete action is pressed', () => {
      const { getByText } = render(
        <ItemCard
          item={mockItem}
          onPress={mockOnPress}
          onDelete={mockOnDelete}
        />
      );

      fireEvent.press(getByText('Delete'));

      expect(Alert.alert).toHaveBeenCalledWith(
        'Delete Item',
        'Are you sure you want to delete "Blue Jeans"? This action cannot be undone.',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Cancel' }),
          expect.objectContaining({ text: 'Delete' })
        ])
      );
    });

    it('shows mark worn confirmation alert when worn action is pressed', () => {
      const { getByText } = render(
        <ItemCard
          item={mockItem}
          onPress={mockOnPress}
          onMarkWorn={mockOnMarkWorn}
        />
      );

      fireEvent.press(getByText('Worn'));

      expect(Alert.alert).toHaveBeenCalledWith(
        'Mark as Worn',
        'Mark "Blue Jeans" as worn today?',
        expect.arrayContaining([
          expect.objectContaining({ text: 'Cancel' }),
          expect.objectContaining({ text: 'Yes' })
        ])
      );
    });
  });

  describe('View modes', () => {
    it('applies correct styles for grid view mode', () => {
      const { getByText } = render(
        <ItemCard
          item={mockItem}
          onPress={mockOnPress}
          viewMode="grid"
        />
      );

      const nameElement = getByText('Blue Jeans');
      expect(nameElement).toBeTruthy();
    });

    it('applies correct styles for list view mode', () => {
      const { getByText } = render(
        <ItemCard
          item={mockItem}
          onPress={mockOnPress}
          viewMode="list"
        />
      );

      const nameElement = getByText('Blue Jeans');
      expect(nameElement).toBeTruthy();
      // List mode shows additional stats
      expect(getByText('Worn: 5 times')).toBeTruthy();
    });
  });

  describe('Conditional rendering', () => {
    it('does not render swipe actions when no action handlers provided', () => {
      const { queryByText } = render(
        <ItemCard
          item={mockItem}
          onPress={mockOnPress}
        />
      );

      expect(queryByText('Edit')).toBeNull();
      expect(queryByText('Delete')).toBeNull();
      expect(queryByText('Favorite')).toBeNull();
      expect(queryByText('Worn')).toBeNull();
    });

    it('renders only provided action handlers', () => {
      const { queryByText, getByText } = render(
        <ItemCard
          item={mockItem}
          onPress={mockOnPress}
          onEdit={mockOnEdit}
          onToggleFavorite={mockOnToggleFavorite}
        />
      );

      expect(getByText('Edit')).toBeTruthy();
      expect(getByText('Favorite')).toBeTruthy();
      expect(queryByText('Delete')).toBeNull();
      expect(queryByText('Worn')).toBeNull();
    });
  });
});