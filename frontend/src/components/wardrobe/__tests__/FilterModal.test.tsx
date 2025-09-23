import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FilterModal } from '../FilterModal';
import { ClothingCategory, ClothingSize, ClothingItemFilters } from '../../../types';

describe('FilterModal', () => {
  const mockOnApplyFilters = jest.fn();
  const mockOnClose = jest.fn();

  const defaultProps = {
    visible: true,
    currentFilters: {} as ClothingItemFilters,
    onApplyFilters: mockOnApplyFilters,
    onClose: mockOnClose,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with empty filters', () => {
      const { getByText } = render(<FilterModal {...defaultProps} />);

      expect(getByText('Filter Items')).toBeTruthy();
      expect(getByText('Cancel')).toBeTruthy();
      expect(getByText('Apply')).toBeTruthy();
    });

    it('renders with existing filters and shows count', () => {
      const filtersWithData: ClothingItemFilters = {
        category: ClothingCategory.TOPS,
        size: ClothingSize.M,
        is_favorite: true,
      };

      const { getByText } = render(
        <FilterModal {...defaultProps} currentFilters={filtersWithData} />
      );

      expect(getByText('3 filters active')).toBeTruthy();
    });

    it('shows singular filter text for single filter', () => {
      const filtersWithData: ClothingItemFilters = {
        category: ClothingCategory.TOPS,
      };

      const { getByText } = render(
        <FilterModal {...defaultProps} currentFilters={filtersWithData} />
      );

      expect(getByText('1 filter active')).toBeTruthy();
    });
  });

  describe('Filter interactions', () => {
    it('handles category selection', () => {
      const { getByText } = render(<FilterModal {...defaultProps} />);

      fireEvent.press(getByText('Tops'));
      fireEvent.press(getByText('Apply'));

      expect(mockOnApplyFilters).toHaveBeenCalledWith({
        category: ClothingCategory.TOPS,
      });
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('handles category deselection when same category is pressed', () => {
      const filtersWithCategory: ClothingItemFilters = {
        category: ClothingCategory.TOPS,
      };

      const { getByText } = render(
        <FilterModal {...defaultProps} currentFilters={filtersWithCategory} />
      );

      fireEvent.press(getByText('Tops'));
      fireEvent.press(getByText('Apply'));

      expect(mockOnApplyFilters).toHaveBeenCalledWith({
        category: undefined,
      });
    });

    it('handles size selection', () => {
      const { getByText } = render(<FilterModal {...defaultProps} />);

      fireEvent.press(getByText('M'));
      fireEvent.press(getByText('Apply'));

      expect(mockOnApplyFilters).toHaveBeenCalledWith({
        size: ClothingSize.M,
      });
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('handles size deselection when same size is pressed', () => {
      const filtersWithSize: ClothingItemFilters = {
        size: ClothingSize.M,
      };

      const { getByText } = render(
        <FilterModal {...defaultProps} currentFilters={filtersWithSize} />
      );

      fireEvent.press(getByText('M'));
      fireEvent.press(getByText('Apply'));

      expect(mockOnApplyFilters).toHaveBeenCalledWith({
        size: undefined,
      });
    });

    it('handles favorite toggle on', () => {
      const { getByDisplayValue } = render(<FilterModal {...defaultProps} />);

      const favoriteSwitch = getByDisplayValue(false);
      fireEvent(favoriteSwitch, 'valueChange', true);

      const { getByText } = render(<FilterModal {...defaultProps} />);
      fireEvent.press(getByText('Apply'));

      expect(mockOnApplyFilters).toHaveBeenCalledWith({
        is_favorite: true,
      });
    });
  });

  describe('Clear filters', () => {
    it('clears all filters when Reset is pressed', () => {
      const filtersWithData: ClothingItemFilters = {
        category: ClothingCategory.TOPS,
        size: ClothingSize.M,
        is_favorite: true,
      };

      const { getByText } = render(
        <FilterModal {...defaultProps} currentFilters={filtersWithData} />
      );

      fireEvent.press(getByText('Reset'));
      fireEvent.press(getByText('Apply'));

      expect(mockOnApplyFilters).toHaveBeenCalledWith({});
    });

    it('clears category filter when Clear Category is pressed', () => {
      const filtersWithCategory: ClothingItemFilters = {
        category: ClothingCategory.TOPS,
      };

      const { getByText } = render(
        <FilterModal {...defaultProps} currentFilters={filtersWithCategory} />
      );

      fireEvent.press(getByText('Clear Category'));
      fireEvent.press(getByText('Apply'));

      expect(mockOnApplyFilters).toHaveBeenCalledWith({
        category: undefined,
      });
    });

    it('clears size filter when Clear Size is pressed', () => {
      const filtersWithSize: ClothingItemFilters = {
        size: ClothingSize.M,
      };

      const { getByText } = render(
        <FilterModal {...defaultProps} currentFilters={filtersWithSize} />
      );

      fireEvent.press(getByText('Clear Size'));
      fireEvent.press(getByText('Apply'));

      expect(mockOnApplyFilters).toHaveBeenCalledWith({
        size: undefined,
      });
    });

    it('shows Clear All Filters button only when filters are active', () => {
      const { queryByText } = render(<FilterModal {...defaultProps} />);
      expect(queryByText('Clear All Filters')).toBeNull();

      const filtersWithData: ClothingItemFilters = {
        category: ClothingCategory.TOPS,
      };

      const { getByText } = render(
        <FilterModal {...defaultProps} currentFilters={filtersWithData} />
      );
      expect(getByText('Clear All Filters')).toBeTruthy();
    });
  });

  describe('Modal controls', () => {
    it('calls onClose when Cancel is pressed', () => {
      const { getByText } = render(<FilterModal {...defaultProps} />);

      fireEvent.press(getByText('Cancel'));

      expect(mockOnClose).toHaveBeenCalled();
      expect(mockOnApplyFilters).not.toHaveBeenCalled();
    });

    it('calls onClose when Apply is pressed', () => {
      const { getByText } = render(<FilterModal {...defaultProps} />);

      fireEvent.press(getByText('Apply'));

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Filter count logic', () => {
    it('correctly counts active filters', () => {
      const filtersWithMultiple: ClothingItemFilters = {
        category: ClothingCategory.TOPS,
        size: ClothingSize.M,
        is_favorite: true,
        brand: 'Nike',
      };

      const { getByText } = render(
        <FilterModal {...defaultProps} currentFilters={filtersWithMultiple} />
      );

      expect(getByText('4 filters active')).toBeTruthy();
      expect(getByText('Apply Filters (4)')).toBeTruthy();
    });

    it('does not count undefined values as filters', () => {
      const filtersWithUndefined: ClothingItemFilters = {
        category: ClothingCategory.TOPS,
        size: undefined,
        is_favorite: undefined,
      };

      const { getByText } = render(
        <FilterModal {...defaultProps} currentFilters={filtersWithUndefined} />
      );

      expect(getByText('1 filter active')).toBeTruthy();
    });
  });
});