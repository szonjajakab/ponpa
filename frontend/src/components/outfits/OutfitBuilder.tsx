import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { OutfitBuilderState, ClothingItem, OutfitCreate } from '../../types';
import { ItemSelector } from './ItemSelector';
import { OutfitPreview } from './OutfitPreview';
import { TagSelector } from '../common/TagSelector';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';

interface OutfitBuilderProps {
  availableItems: ClothingItem[];
  initialOutfit?: Partial<OutfitCreate>;
  onSave: (outfit: OutfitCreate) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const OutfitBuilder: React.FC<OutfitBuilderProps> = ({
  availableItems,
  initialOutfit,
  onSave,
  onCancel,
  isLoading = false,
}) => {
  const [builderState, setBuilderState] = useState<OutfitBuilderState>({
    selectedItems: initialOutfit?.clothing_item_ids
      ? availableItems.filter(item => initialOutfit.clothing_item_ids?.includes(item.id))
      : [],
    previewItems: [],
    currentStep: 'select',
    metadata: {
      name: initialOutfit?.name || '',
      description: initialOutfit?.description || '',
      occasion: initialOutfit?.occasion,
      season: initialOutfit?.season,
      weather: initialOutfit?.weather,
      tags: initialOutfit?.tags || [],
    },
  });

  const steps = [
    { key: 'select', title: 'Select Items', icon: '👕' },
    { key: 'arrange', title: 'Preview', icon: '👗' },
    { key: 'metadata', title: 'Details', icon: '📝' },
  ];

  const currentStepIndex = steps.findIndex(step => step.key === builderState.currentStep);

  const updateBuilderState = useCallback((updates: Partial<OutfitBuilderState>) => {
    setBuilderState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateMetadata = useCallback((updates: Partial<OutfitBuilderState['metadata']>) => {
    setBuilderState(prev => ({
      ...prev,
      metadata: { ...prev.metadata, ...updates },
    }));
  }, []);

  const handleItemSelectionChange = (selectedItems: ClothingItem[]) => {
    updateBuilderState({ selectedItems });
  };

  const handleNextStep = () => {
    if (builderState.currentStep === 'select') {
      if (builderState.selectedItems.length === 0) {
        Alert.alert('No Items Selected', 'Please select at least one clothing item for your outfit.');
        return;
      }
      updateBuilderState({ currentStep: 'arrange' });
    } else if (builderState.currentStep === 'arrange') {
      updateBuilderState({ currentStep: 'metadata' });
    } else if (builderState.currentStep === 'metadata') {
      handleSaveOutfit();
    }
  };

  const handlePreviousStep = () => {
    if (builderState.currentStep === 'arrange') {
      updateBuilderState({ currentStep: 'select' });
    } else if (builderState.currentStep === 'metadata') {
      updateBuilderState({ currentStep: 'arrange' });
    }
  };

  const handleSaveOutfit = () => {
    if (!builderState.metadata.name?.trim()) {
      Alert.alert('Missing Name', 'Please enter a name for your outfit.');
      return;
    }

    if (builderState.selectedItems.length === 0) {
      Alert.alert('No Items Selected', 'Please select at least one clothing item for your outfit.');
      return;
    }

    const outfit: OutfitCreate = {
      name: builderState.metadata.name.trim(),
      description: builderState.metadata.description?.trim(),
      clothing_item_ids: builderState.selectedItems.map(item => item.id),
      tags: builderState.metadata.tags,
      occasion: builderState.metadata.occasion,
      season: builderState.metadata.season,
      weather: builderState.metadata.weather,
    };

    onSave(outfit);
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {steps.map((step, index) => (
        <React.Fragment key={step.key}>
          <View style={styles.stepItem}>
            <View style={[
              styles.stepCircle,
              index <= currentStepIndex && styles.activeStepCircle,
              index < currentStepIndex && styles.completedStepCircle,
            ]}>
              <Text style={[
                styles.stepIcon,
                index <= currentStepIndex && styles.activeStepIcon,
              ]}>
                {index < currentStepIndex ? '✓' : step.icon}
              </Text>
            </View>
            <Text style={[
              styles.stepTitle,
              index <= currentStepIndex && styles.activeStepTitle,
            ]}>
              {step.title}
            </Text>
          </View>
          {index < steps.length - 1 && (
            <View style={[
              styles.stepConnector,
              index < currentStepIndex && styles.activeStepConnector,
            ]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  const renderSelectStep = () => (
    <View style={styles.stepContent}>
      <ItemSelector
        items={availableItems}
        selectedItems={builderState.selectedItems}
        onSelectionChange={handleItemSelectionChange}
        searchPlaceholder="Search your wardrobe..."
      />
    </View>
  );

  const renderArrangeStep = () => (
    <View style={styles.stepContent}>
      <View style={styles.arrangeContainer}>
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>Outfit Preview</Text>
          <OutfitPreview
            items={builderState.selectedItems}
            itemPositions={builderState.previewItems}
            size="large"
            showItemNames={true}
          />
        </View>

        <View style={styles.selectedItemsList}>
          <Text style={styles.sectionTitle}>
            Selected Items ({builderState.selectedItems.length})
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectedItemsContent}
          >
            {builderState.selectedItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={styles.selectedItemCard}
                onPress={() => {
                  // Remove item from selection
                  const newItems = builderState.selectedItems.filter(i => i.id !== item.id);
                  handleItemSelectionChange(newItems);
                }}
              >
                <View style={styles.selectedItemImage}>
                  {item.image_urls[0] ? (
                    <Text style={styles.selectedItemEmoji}>👔</Text>
                  ) : (
                    <Text style={styles.selectedItemEmoji}>👔</Text>
                  )}
                </View>
                <Text style={styles.selectedItemName} numberOfLines={2}>
                  {item.name}
                </Text>
                <View style={styles.removeItemButton}>
                  <Text style={styles.removeItemText}>×</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  );

  const renderMetadataStep = () => (
    <View style={styles.stepContent}>
      <ScrollView
        style={styles.metadataContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Outfit Name */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Outfit Name *</Text>
          <TextInput
            style={styles.textInput}
            value={builderState.metadata.name}
            onChangeText={(text) => updateMetadata({ name: text })}
            placeholder="Enter outfit name..."
            placeholderTextColor={colors.inputPlaceholder}
            maxLength={50}
          />
        </View>

        {/* Description */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Description</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={builderState.metadata.description}
            onChangeText={(text) => updateMetadata({ description: text })}
            placeholder="Describe your outfit..."
            placeholderTextColor={colors.inputPlaceholder}
            multiline
            numberOfLines={3}
            maxLength={200}
          />
        </View>

        {/* Occasion */}
        <View style={styles.inputSection}>
          <TagSelector
            type="occasion"
            title="Occasion"
            selectedValue={builderState.metadata.occasion}
            onSelectionChange={(value) => updateMetadata({ occasion: value })}
            placeholder="Select an occasion for this outfit"
          />
        </View>

        {/* Season */}
        <View style={styles.inputSection}>
          <TagSelector
            type="season"
            title="Season"
            selectedValue={builderState.metadata.season}
            onSelectionChange={(value) => updateMetadata({ season: value })}
            placeholder="Select a season for this outfit"
          />
        </View>

        {/* Weather */}
        <View style={styles.inputSection}>
          <TagSelector
            type="weather"
            title="Weather"
            selectedValue={builderState.metadata.weather}
            onSelectionChange={(value) => updateMetadata({ weather: value })}
            placeholder="Select weather conditions"
          />
        </View>

        {/* Custom Tags */}
        <View style={styles.inputSection}>
          <TagSelector
            type="custom"
            title="Custom Tags"
            selectedTags={builderState.metadata.tags}
            onTagsChange={(tags) => updateMetadata({ tags })}
            multiSelect={true}
            placeholder="Add custom tags to categorize your outfit"
          />
        </View>
      </ScrollView>
    </View>
  );

  const renderCurrentStep = () => {
    switch (builderState.currentStep) {
      case 'select':
        return renderSelectStep();
      case 'arrange':
        return renderArrangeStep();
      case 'metadata':
        return renderMetadataStep();
      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (builderState.currentStep) {
      case 'select':
        return builderState.selectedItems.length > 0;
      case 'arrange':
        return true;
      case 'metadata':
        return !!builderState.metadata.name?.trim();
      default:
        return false;
    }
  };

  const getNextButtonText = () => {
    switch (builderState.currentStep) {
      case 'select':
        return 'Continue to Preview';
      case 'arrange':
        return 'Add Details';
      case 'metadata':
        return 'Save Outfit';
      default:
        return 'Next';
    }
  };

  return (
    <View style={styles.container}>
      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Step Content */}
      {renderCurrentStep()}

      {/* Navigation Buttons */}
      <View style={styles.navigationButtons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          disabled={isLoading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        {currentStepIndex > 0 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handlePreviousStep}
            disabled={isLoading}
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.nextButton,
            (!canProceed() || isLoading) && styles.nextButtonDisabled,
          ]}
          onPress={handleNextStep}
          disabled={!canProceed() || isLoading}
        >
          <Text style={[
            styles.nextButtonText,
            (!canProceed() || isLoading) && styles.nextButtonTextDisabled,
          ]}>
            {isLoading ? 'Saving...' : getNextButtonText()}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  stepIndicator: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingVertical: dimensions.spacing.lg,
    paddingHorizontal: dimensions.containerPadding.horizontal,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  stepItem: {
    alignItems: 'center' as const,
    flex: 1,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray200,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: dimensions.spacing.xs,
  },
  activeStepCircle: {
    backgroundColor: colors.primary,
  },
  completedStepCircle: {
    backgroundColor: colors.success,
  },
  stepIcon: {
    fontSize: dimensions.fontSize.md,
  },
  activeStepIcon: {
    color: colors.white,
  },
  stepTitle: {
    fontSize: dimensions.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center' as const,
  },
  activeStepTitle: {
    color: colors.textPrimary,
    fontWeight: '600' as const,
  },
  stepConnector: {
    height: 2,
    backgroundColor: colors.gray200,
    flex: 0.5,
    marginTop: -25,
  },
  activeStepConnector: {
    backgroundColor: colors.success,
  },
  stepContent: {
    flex: 1,
  },
  arrangeContainer: {
    flex: 1,
    padding: dimensions.containerPadding.horizontal,
  },
  previewSection: {
    alignItems: 'center' as const,
    marginBottom: dimensions.spacing.xl,
  },
  sectionTitle: {
    fontSize: dimensions.fontSize.lg,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.md,
  },
  selectedItemsList: {
    marginTop: dimensions.spacing.lg,
  },
  selectedItemsContent: {
    paddingHorizontal: dimensions.spacing.sm,
  },
  selectedItemCard: {
    width: 80,
    marginRight: dimensions.spacing.md,
    alignItems: 'center' as const,
    position: 'relative' as const,
  },
  selectedItemImage: {
    width: 60,
    height: 60,
    borderRadius: dimensions.borderRadius.md,
    backgroundColor: colors.gray100,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: dimensions.spacing.xs,
  },
  selectedItemEmoji: {
    fontSize: 24,
  },
  selectedItemName: {
    fontSize: dimensions.fontSize.xs,
    textAlign: 'center' as const,
    color: colors.textPrimary,
  },
  removeItemButton: {
    position: 'absolute' as const,
    top: -5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.error,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  removeItemText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold' as const,
  },
  metadataContainer: {
    flex: 1,
    padding: dimensions.containerPadding.horizontal,
  },
  inputSection: {
    marginBottom: dimensions.spacing.xl,
  },
  inputLabel: {
    fontSize: dimensions.fontSize.md,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: dimensions.borderRadius.md,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    fontSize: dimensions.fontSize.md,
    backgroundColor: colors.inputBackground,
    color: colors.textPrimary,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top' as const,
  },
  navigationButtons: {
    flexDirection: 'row' as const,
    paddingHorizontal: dimensions.containerPadding.horizontal,
    paddingVertical: dimensions.spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: dimensions.spacing.sm,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: dimensions.spacing.md,
    backgroundColor: colors.gray200,
    borderRadius: dimensions.borderRadius.md,
    alignItems: 'center' as const,
  },
  cancelButtonText: {
    fontSize: dimensions.fontSize.md,
    color: colors.textPrimary,
    fontWeight: '600' as const,
  },
  backButton: {
    flex: 1,
    paddingVertical: dimensions.spacing.md,
    backgroundColor: colors.gray200,
    borderRadius: dimensions.borderRadius.md,
    alignItems: 'center' as const,
  },
  backButtonText: {
    fontSize: dimensions.fontSize.md,
    color: colors.textPrimary,
    fontWeight: '600' as const,
  },
  nextButton: {
    flex: 2,
    paddingVertical: dimensions.spacing.md,
    backgroundColor: colors.primary,
    borderRadius: dimensions.borderRadius.md,
    alignItems: 'center' as const,
  },
  nextButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  nextButtonText: {
    fontSize: dimensions.fontSize.md,
    color: colors.white,
    fontWeight: '600' as const,
  },
  nextButtonTextDisabled: {
    color: colors.gray400,
  },
};