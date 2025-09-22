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

  const requestPermissions = async () => {
    const { status } = await ImagePickerExpo.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Denied',
        'Please enable photo library access to select images.'
      );
      return false;
    }

    const cameraStatus = await ImagePickerExpo.requestCameraPermissionsAsync();
    if (cameraStatus.status !== 'granted') {
      Alert.alert(
        'Permission Denied',
        'Please enable camera access to take photos.'
      );
      return false;
    }

    return true;
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
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      setIsLoading(true);
      const result = await ImagePickerExpo.launchCameraAsync({
        mediaTypes: ImagePickerExpo.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGalleryPress = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      setIsLoading(true);
      const result = await ImagePickerExpo.launchImageLibraryAsync({
        mediaTypes: ImagePickerExpo.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onImageSelected(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to select image');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePress = () => {
    if (disabled || isLoading) return;
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