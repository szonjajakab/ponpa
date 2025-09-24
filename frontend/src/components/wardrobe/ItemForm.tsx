import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  ClothingItem,
  ClothingItemCreate,
  ClothingItemUpdate,
  ClothingCategory,
  ClothingSize,
  Color,
} from '../../types';
import { ImagePicker } from '../common/ImagePicker';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';

interface ItemFormProps {
  initialData?: Partial<ClothingItem>;
  onSubmit: (data: ClothingItemCreate | ClothingItemUpdate, images?: string[]) => void;
  onCancel: () => void;
  isLoading?: boolean;
  isEditing?: boolean;
}

interface FormData {
  name: string;
  category: ClothingCategory;
  brand: string;
  size: ClothingSize | '';
  colors: Color[];
  description: string;
  purchase_price: string;
  tags: string;
  condition: string;
  notes: string;
}

const schema = yup.object().shape({
  name: yup.string().required('Name is required').min(1).max(100),
  category: yup.string().required('Category is required'),
  brand: yup.string().max(50),
  size: yup.string(),
  description: yup.string().max(500),
  purchase_price: yup.string(),
  tags: yup.string(),
  condition: yup.string(),
  notes: yup.string().max(1000),
});

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

export const ItemForm: React.FC<ItemFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  isEditing = false,
}) => {
  const [selectedImages, setSelectedImages] = useState<string[]>(
    initialData?.image_urls || []
  );
  const [selectedColors, setSelectedColors] = useState<Color[]>(
    initialData?.colors || []
  );
  const [newColorName, setNewColorName] = useState('');

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<FormData>({
    resolver: yupResolver(schema) as any,
    mode: 'onChange',
    defaultValues: {
      name: initialData?.name || '',
      category: initialData?.category || ClothingCategory.TOPS,
      brand: initialData?.brand || '',
      size: initialData?.size || '',
      description: initialData?.description || '',
      purchase_price: initialData?.purchase_price?.toString() || '',
      tags: initialData?.tags?.join(', ') || '',
      condition: initialData?.condition || '',
      notes: initialData?.notes || '',
    },
  });

  const selectedCategory = watch('category');

  const handleImageSelected = (uri: string) => {
    if (selectedImages.length < 10) {
      setSelectedImages(prev => [...prev, uri]);
    } else {
      Alert.alert('Maximum Images', 'You can only add up to 10 images per item.');
    }
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddColor = () => {
    if (newColorName.trim()) {
      const newColor: Color = {
        name: newColorName.trim(),
      };
      setSelectedColors(prev => [...prev, newColor]);
      setNewColorName('');
    }
  };

  const handleRemoveColor = (index: number) => {
    setSelectedColors(prev => prev.filter((_, i) => i !== index));
  };

  const handleFormSubmit = (data: FormData) => {
    const price = data.purchase_price ? parseFloat(data.purchase_price) : undefined;
    const tags = data.tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    const formData: ClothingItemCreate | ClothingItemUpdate = {
      name: data.name,
      category: data.category as ClothingCategory,
      brand: data.brand || undefined,
      size: data.size ? (data.size as ClothingSize) : undefined,
      colors: selectedColors,
      description: data.description || undefined,
      purchase_price: price,
      tags,
      condition: data.condition || undefined,
      notes: data.notes || undefined,
    };

    onSubmit(formData, selectedImages);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Images Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <View style={styles.imagesContainer}>
              <ImagePicker
                onImageSelected={handleImageSelected}
                placeholder="Add Photo"
                size={80}
                borderRadius={8}
                disabled={isLoading || selectedImages.length >= 10}
              />
              {selectedImages.map((uri, index) => (
                <View key={index} style={styles.imageItem}>
                  <ImagePicker
                    imageUri={uri}
                    onImageSelected={() => {}}
                    size={80}
                    borderRadius={8}
                    disabled={true}
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => handleRemoveImage(index)}
                  >
                    <Text style={styles.removeImageText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <Text style={styles.helperText}>
              Add up to 10 photos • First photo will be the main image
            </Text>
          </View>

          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Name *</Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.name && styles.inputError]}
                    placeholder="e.g., Blue denim jacket"
                    placeholderTextColor={colors.inputPlaceholder}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    editable={!isLoading}
                  />
                )}
              />
              {errors.name && (
                <Text style={styles.errorText}>{errors.name.message}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Category *</Text>
              <View style={styles.optionsContainer}>
                {CATEGORY_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      selectedCategory === option.value && styles.selectedOption,
                    ]}
                    onPress={() => setValue('category', option.value)}
                    disabled={isLoading}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selectedCategory === option.value && styles.selectedOptionText,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Brand</Text>
              <Controller
                control={control}
                name="brand"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Levi's, Nike, Zara"
                    placeholderTextColor={colors.inputPlaceholder}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    editable={!isLoading}
                  />
                )}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Size</Text>
              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={[
                    styles.optionButton,
                    watch('size') === '' && styles.selectedOption,
                  ]}
                  onPress={() => setValue('size', '')}
                  disabled={isLoading}
                >
                  <Text
                    style={[
                      styles.optionText,
                      watch('size') === '' && styles.selectedOptionText,
                    ]}
                  >
                    No Size
                  </Text>
                </TouchableOpacity>
                {SIZE_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      watch('size') === option.value && styles.selectedOption,
                    ]}
                    onPress={() => setValue('size', option.value)}
                    disabled={isLoading}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        watch('size') === option.value && styles.selectedOptionText,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Colors Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Colors</Text>
            <View style={styles.colorsContainer}>
              {selectedColors.map((color, index) => (
                <View key={index} style={styles.colorChip}>
                  <Text style={styles.colorText}>{color.name}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveColor(index)}
                    style={styles.removeColorButton}
                  >
                    <Text style={styles.removeColorText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <View style={styles.addColorContainer}>
              <TextInput
                style={styles.colorInput}
                placeholder="Add color (e.g., Navy blue)"
                placeholderTextColor={colors.inputPlaceholder}
                value={newColorName}
                onChangeText={setNewColorName}
                onSubmitEditing={handleAddColor}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.addColorButton}
                onPress={handleAddColor}
                disabled={!newColorName.trim() || isLoading}
              >
                <Text style={styles.addColorButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Additional Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Details</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description</Text>
              <Controller
                control={control}
                name="description"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Describe the item, its style, fit, etc."
                    placeholderTextColor={colors.inputPlaceholder}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    editable={!isLoading}
                  />
                )}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Purchase Price</Text>
              <Controller
                control={control}
                name="purchase_price"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 49.99"
                    placeholderTextColor={colors.inputPlaceholder}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="decimal-pad"
                    editable={!isLoading}
                  />
                )}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Tags</Text>
              <Controller
                control={control}
                name="tags"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., casual, winter, work (separate with commas)"
                    placeholderTextColor={colors.inputPlaceholder}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    editable={!isLoading}
                  />
                )}
              />
              <Text style={styles.helperText}>
                Separate tags with commas (e.g., casual, winter, work)
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Condition</Text>
              <Controller
                control={control}
                name="condition"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Excellent, Good, Fair, Poor"
                    placeholderTextColor={colors.inputPlaceholder}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    editable={!isLoading}
                  />
                )}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Notes</Text>
              <Controller
                control={control}
                name="notes"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Any additional notes or memories about this item"
                    placeholderTextColor={colors.inputPlaceholder}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    editable={!isLoading}
                  />
                )}
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitButton,
                (!isValid || isLoading) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit(handleFormSubmit as any)}
              disabled={!isValid || isLoading}
            >
              <Text style={styles.submitButtonText}>
                {isLoading
                  ? 'Saving...'
                  : isEditing
                  ? 'Update Item'
                  : 'Add Item'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: dimensions.containerPadding.horizontal,
    paddingBottom: dimensions.spacing.xxxl,
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
  inputContainer: {
    marginBottom: dimensions.spacing.lg,
  },
  label: {
    fontSize: dimensions.fontSize.md,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: dimensions.spacing.sm,
  },
  input: {
    height: dimensions.inputHeight.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: dimensions.borderRadius.md,
    paddingHorizontal: dimensions.spacing.md,
    fontSize: dimensions.fontSize.md,
    backgroundColor: colors.inputBackground,
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.error,
  },
  textArea: {
    height: 80,
    paddingVertical: dimensions.spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: dimensions.fontSize.sm,
    marginTop: dimensions.spacing.xs,
  },
  helperText: {
    fontSize: dimensions.fontSize.sm,
    color: colors.textSecondary,
    marginTop: dimensions.spacing.xs,
  },
  optionsContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: dimensions.spacing.sm,
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
  imagesContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: dimensions.spacing.sm,
    marginBottom: dimensions.spacing.sm,
  },
  imageItem: {
    position: 'relative' as const,
  },
  removeImageButton: {
    position: 'absolute' as const,
    top: -5,
    right: -5,
    backgroundColor: colors.error,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  removeImageText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold' as const,
    lineHeight: 16,
  },
  colorsContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: dimensions.spacing.sm,
    marginBottom: dimensions.spacing.md,
  },
  colorChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.gray100,
    borderRadius: dimensions.borderRadius.md,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
  },
  colorText: {
    fontSize: dimensions.fontSize.sm,
    color: colors.textPrimary,
    marginRight: dimensions.spacing.sm,
  },
  removeColorButton: {
    width: 16,
    height: 16,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  removeColorText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: 'bold' as const,
  },
  addColorContainer: {
    flexDirection: 'row' as const,
    gap: dimensions.spacing.sm,
  },
  colorInput: {
    flex: 1,
    height: dimensions.inputHeight.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: dimensions.borderRadius.md,
    paddingHorizontal: dimensions.spacing.md,
    fontSize: dimensions.fontSize.md,
    backgroundColor: colors.inputBackground,
    color: colors.textPrimary,
  },
  addColorButton: {
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: dimensions.borderRadius.md,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  addColorButtonText: {
    color: colors.white,
    fontSize: dimensions.fontSize.sm,
    fontWeight: '600' as const,
  },
  actionButtons: {
    flexDirection: 'row' as const,
    gap: dimensions.spacing.md,
    marginTop: dimensions.spacing.xl,
  },
  cancelButton: {
    flex: 1,
    height: dimensions.buttonHeight.lg,
    backgroundColor: colors.gray200,
    borderRadius: dimensions.borderRadius.md,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  cancelButtonText: {
    color: colors.textPrimary,
    fontSize: dimensions.fontSize.md,
    fontWeight: '600' as const,
  },
  submitButton: {
    flex: 1,
    height: dimensions.buttonHeight.lg,
    backgroundColor: colors.primary,
    borderRadius: dimensions.borderRadius.md,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  submitButtonDisabled: {
    backgroundColor: colors.gray400,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: dimensions.fontSize.md,
    fontWeight: '600' as const,
  },
};