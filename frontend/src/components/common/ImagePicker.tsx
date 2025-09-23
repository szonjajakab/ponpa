import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import * as ImagePickerExpo from 'expo-image-picker';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';

interface ImagePickerProps {
  imageUri?: string;
  onImageSelected: (uri: string) => void;
  placeholder?: string;
  size?: number;
  borderRadius?: number;
  disabled?: boolean;
}

export const ImagePicker: React.FC<ImagePickerProps> = ({
  imageUri,
  onImageSelected,
  placeholder = 'Add Photo',
  size = 120,
  borderRadius = 60,
  disabled = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const requestMediaLibraryPermission = async () => {
    try {
      const permission = await ImagePickerExpo.getMediaLibraryPermissionsAsync();
      if (permission.granted) {
        return true;
      }

      if (permission.canAskAgain) {
        const { status } = await ImagePickerExpo.requestMediaLibraryPermissionsAsync();
        if (status === 'granted') {
          return true;
        }
      }

      Alert.alert(
        'Permission Required',
        'Please enable photo library access in Settings to select images.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => ImagePickerExpo.requestMediaLibraryPermissionsAsync() }
        ]
      );
      return false;
    } catch (error) {
      console.error('Media library permission error:', error);
      Alert.alert('Error', 'Failed to request photo library permission');
      return false;
    }
  };

  const requestCameraPermission = async () => {
    try {
      const permission = await ImagePickerExpo.getCameraPermissionsAsync();
      if (permission.granted) {
        return true;
      }

      if (permission.canAskAgain) {
        const { status } = await ImagePickerExpo.requestCameraPermissionsAsync();
        if (status === 'granted') {
          return true;
        }
      }

      Alert.alert(
        'Permission Required',
        'Please enable camera access in Settings to take photos.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => ImagePickerExpo.requestCameraPermissionsAsync() }
        ]
      );
      return false;
    } catch (error) {
      console.error('Camera permission error:', error);
      Alert.alert('Error', 'Failed to request camera permission');
      return false;
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Select Image',
      'Choose how you would like to select an image',
      [
        {
          text: 'Camera',
          onPress: handleCameraPress,
        },
        {
          text: 'Photo Library',
          onPress: handleGalleryPress,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleCameraPress = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      setIsLoading(true);
      console.log('Launching camera...');

      const result = await ImagePickerExpo.launchCameraAsync({
        mediaTypes: ImagePickerExpo.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      console.log('Camera result:', { canceled: result.canceled, assetsLength: result.assets?.length });

      if (!result.canceled && result.assets && result.assets[0]) {
        const uri = result.assets[0].uri;
        console.log('Selected image URI:', uri);
        onImageSelected(uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Camera Error', `Failed to take photo: ${error.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGalleryPress = async () => {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return;

    try {
      setIsLoading(true);
      console.log('Launching photo library...');

      const result = await ImagePickerExpo.launchImageLibraryAsync({
        mediaTypes: ImagePickerExpo.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      console.log('Gallery result:', { canceled: result.canceled, assetsLength: result.assets?.length });

      if (!result.canceled && result.assets && result.assets[0]) {
        const uri = result.assets[0].uri;
        console.log('Selected image URI:', uri);
        onImageSelected(uri);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Gallery Error', `Failed to select image: ${error.message || error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePress = () => {
    if (disabled || isLoading) return;

    // For debugging: try direct photo library access first
    console.log('ImagePicker pressed, launching options...');
    showImageOptions();
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius,
        },
        disabled && styles.disabled,
      ]}
      onPress={handlePress}
      disabled={disabled || isLoading}
    >
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={[
            styles.image,
            {
              width: size,
              height: size,
              borderRadius,
            },
          ]}
        />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>
            {isLoading ? 'Loading...' : placeholder}
          </Text>
        </View>
      )}

      {!disabled && (
        <View style={styles.editOverlay}>
          <Text style={styles.editText}>✎</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = {
  container: {
    position: 'relative' as const,
    backgroundColor: colors.gray100,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    overflow: 'hidden' as const,
  },
  disabled: {
    opacity: 0.6,
  },
  image: {
    backgroundColor: colors.gray100,
  },
  placeholder: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: dimensions.spacing.md,
  },
  placeholderText: {
    fontSize: dimensions.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    fontWeight: '500' as const,
  },
  editOverlay: {
    position: 'absolute' as const,
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: colors.white,
  },
  editText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold' as const,
  },
};