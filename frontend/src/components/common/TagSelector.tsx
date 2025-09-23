import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { OutfitOccasion, OutfitSeason, OutfitWeather } from '../../types';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';

interface TagSelectorProps {
  type: 'occasion' | 'season' | 'weather' | 'custom';
  selectedValue?: string;
  selectedTags?: string[];
  onSelectionChange: (value?: string) => void;
  onTagsChange?: (tags: string[]) => void;
  multiSelect?: boolean;
  placeholder?: string;
  title?: string;
}

export const TagSelector: React.FC<TagSelectorProps> = ({
  type,
  selectedValue,
  selectedTags = [],
  onSelectionChange,
  onTagsChange,
  multiSelect = false,
  placeholder,
  title,
}) => {
  const [customTagInput, setCustomTagInput] = useState('');

  // Define predefined options for each type
  const getOptions = (): { value: string; label: string; emoji?: string }[] => {
    switch (type) {
      case 'occasion':
        return [
          { value: 'casual', label: 'Casual', emoji: '👕' },
          { value: 'work', label: 'Work', emoji: '👔' },
          { value: 'formal', label: 'Formal', emoji: '🤵' },
          { value: 'party', label: 'Party', emoji: '🎉' },
          { value: 'date', label: 'Date', emoji: '💕' },
          { value: 'workout', label: 'Workout', emoji: '🏃' },
          { value: 'travel', label: 'Travel', emoji: '✈️' },
          { value: 'special_event', label: 'Special Event', emoji: '🎊' },
          { value: 'other', label: 'Other', emoji: '📝' },
        ];

      case 'season':
        return [
          { value: 'spring', label: 'Spring', emoji: '🌸' },
          { value: 'summer', label: 'Summer', emoji: '☀️' },
          { value: 'fall', label: 'Fall', emoji: '🍂' },
          { value: 'winter', label: 'Winter', emoji: '❄️' },
          { value: 'all_season', label: 'All Season', emoji: '🔄' },
        ];

      case 'weather':
        return [
          { value: 'sunny', label: 'Sunny', emoji: '☀️' },
          { value: 'rainy', label: 'Rainy', emoji: '🌧️' },
          { value: 'cloudy', label: 'Cloudy', emoji: '☁️' },
          { value: 'snowy', label: 'Snowy', emoji: '❄️' },
          { value: 'windy', label: 'Windy', emoji: '💨' },
          { value: 'hot', label: 'Hot', emoji: '🔥' },
          { value: 'cold', label: 'Cold', emoji: '🥶' },
          { value: 'mild', label: 'Mild', emoji: '🌤️' },
          { value: 'any', label: 'Any Weather', emoji: '🌈' },
        ];

      default:
        return [];
    }
  };

  const options = getOptions();

  const handleOptionToggle = (optionValue: string) => {
    if (multiSelect && onTagsChange) {
      // Multi-select mode for custom tags
      const isSelected = selectedTags.includes(optionValue);
      const newTags = isSelected
        ? selectedTags.filter(tag => tag !== optionValue)
        : [...selectedTags, optionValue];
      onTagsChange(newTags);
    } else {
      // Single select mode
      const newValue = selectedValue === optionValue ? undefined : optionValue;
      onSelectionChange(newValue);
    }
  };

  const handleAddCustomTag = () => {
    if (!customTagInput.trim()) return;

    if (selectedTags.includes(customTagInput.trim())) {
      Alert.alert('Duplicate Tag', 'This tag already exists.');
      return;
    }

    if (selectedTags.length >= 10) {
      Alert.alert('Too Many Tags', 'You can only add up to 10 custom tags.');
      return;
    }

    const newTags = [...selectedTags, customTagInput.trim()];
    onTagsChange?.(newTags);
    setCustomTagInput('');
  };

  const handleRemoveCustomTag = (tagToRemove: string) => {
    const newTags = selectedTags.filter(tag => tag !== tagToRemove);
    onTagsChange?.(newTags);
  };

  const renderPredefinedOptions = () => (
    <View style={styles.optionsContainer}>
      {options.map(option => {
        const isSelected = multiSelect
          ? selectedTags.includes(option.value)
          : selectedValue === option.value;

        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              isSelected && styles.selectedOption,
            ]}
            onPress={() => handleOptionToggle(option.value)}
            activeOpacity={0.7}
          >
            {option.emoji && (
              <Text style={styles.optionEmoji}>{option.emoji}</Text>
            )}
            <Text style={[
              styles.optionText,
              isSelected && styles.selectedOptionText,
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderCustomTagInput = () => {
    if (type !== 'custom' || !onTagsChange) return null;

    return (
      <View style={styles.customTagSection}>
        <Text style={styles.customTagTitle}>Add Custom Tags</Text>
        <View style={styles.customTagInputContainer}>
          <TextInput
            style={styles.customTagInput}
            value={customTagInput}
            onChangeText={setCustomTagInput}
            placeholder="Enter custom tag..."
            placeholderTextColor={colors.inputPlaceholder}
            maxLength={20}
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={handleAddCustomTag}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[
              styles.addTagButton,
              !customTagInput.trim() && styles.addTagButtonDisabled,
            ]}
            onPress={handleAddCustomTag}
            disabled={!customTagInput.trim()}
          >
            <Text style={[
              styles.addTagButtonText,
              !customTagInput.trim() && styles.addTagButtonTextDisabled,
            ]}>
              Add
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSelectedTags = () => {
    if (type !== 'custom' || selectedTags.length === 0) return null;

    return (
      <View style={styles.selectedTagsSection}>
        <Text style={styles.selectedTagsTitle}>Selected Tags ({selectedTags.length}/10)</Text>
        <View style={styles.selectedTagsContainer}>
          {selectedTags.map((tag, index) => (
            <View key={index} style={styles.selectedTag}>
              <Text style={styles.selectedTagText}>{tag}</Text>
              <TouchableOpacity
                style={styles.removeTagButton}
                onPress={() => handleRemoveCustomTag(tag)}
              >
                <Text style={styles.removeTagButtonText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderClearButton = () => {
    const hasSelection = multiSelect ? selectedTags.length > 0 : selectedValue;
    if (!hasSelection) return null;

    return (
      <TouchableOpacity
        style={styles.clearButton}
        onPress={() => {
          if (multiSelect && onTagsChange) {
            onTagsChange([]);
          } else {
            onSelectionChange(undefined);
          }
        }}
      >
        <Text style={styles.clearButtonText}>Clear All</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {title && (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {renderClearButton()}
        </View>
      )}

      {placeholder && !selectedValue && selectedTags.length === 0 && (
        <Text style={styles.placeholder}>{placeholder}</Text>
      )}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {type !== 'custom' && renderPredefinedOptions()}
        {renderCustomTagInput()}
        {renderSelectedTags()}
      </ScrollView>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: dimensions.spacing.md,
  },
  title: {
    fontSize: dimensions.fontSize.lg,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  placeholder: {
    fontSize: dimensions.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    fontStyle: 'italic' as const,
    marginVertical: dimensions.spacing.lg,
  },
  content: {
    flex: 1,
  },
  optionsContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: dimensions.spacing.sm,
    marginBottom: dimensions.spacing.lg,
  },
  optionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
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
  optionEmoji: {
    fontSize: dimensions.fontSize.md,
    marginRight: dimensions.spacing.xs,
  },
  optionText: {
    fontSize: dimensions.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: '500' as const,
  },
  selectedOptionText: {
    color: colors.white,
  },
  customTagSection: {
    marginBottom: dimensions.spacing.lg,
  },
  customTagTitle: {
    fontSize: dimensions.fontSize.md,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
  },
  customTagInputContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: dimensions.spacing.sm,
  },
  customTagInput: {
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
  addTagButton: {
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: dimensions.borderRadius.md,
  },
  addTagButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  addTagButtonText: {
    color: colors.white,
    fontSize: dimensions.fontSize.sm,
    fontWeight: '600' as const,
  },
  addTagButtonTextDisabled: {
    color: colors.gray400,
  },
  selectedTagsSection: {
    marginBottom: dimensions.spacing.lg,
  },
  selectedTagsTitle: {
    fontSize: dimensions.fontSize.md,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
  },
  selectedTagsContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: dimensions.spacing.sm,
  },
  selectedTag: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.primary + '20',
    borderRadius: dimensions.borderRadius.md,
    paddingLeft: dimensions.spacing.sm,
    paddingRight: dimensions.spacing.xs,
    paddingVertical: dimensions.spacing.xs,
  },
  selectedTagText: {
    fontSize: dimensions.fontSize.sm,
    color: colors.primary,
    fontWeight: '500' as const,
    marginRight: dimensions.spacing.xs,
  },
  removeTagButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  removeTagButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold' as const,
    lineHeight: 16,
  },
  clearButton: {
    paddingHorizontal: dimensions.spacing.sm,
    paddingVertical: dimensions.spacing.xs,
  },
  clearButtonText: {
    fontSize: dimensions.fontSize.sm,
    color: colors.primary,
    fontWeight: '600' as const,
  },
};