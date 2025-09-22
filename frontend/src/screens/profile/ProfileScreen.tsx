import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';
import { profileSchemas, ProfileFormData } from '../../utils/validators';
import { useAuth } from '../../store/useStore';
import { ImagePicker } from '../../components/common/ImagePicker';

export const ProfileScreen: React.FC = () => {
  const { user, updateProfile, logout, isLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState(user?.photoURL || '');

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: yupResolver(profileSchemas.updateProfile),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      displayName: user?.displayName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      website: user?.website || '',
    },
  });

  const handleSave = async (data: ProfileFormData) => {
    try {
      await updateProfile({
        ...data,
        photoURL: profileImage !== user?.photoURL ? profileImage : user?.photoURL,
      });
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    }
  };

  const handleCancel = () => {
    reset();
    setProfileImage(user?.photoURL || '');
    setIsEditing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const handleImageSelected = (uri: string) => {
    setProfileImage(uri);
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No user data available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Profile</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditing(!isEditing)}
              disabled={isLoading}
            >
              <Text style={styles.editButtonText}>
                {isEditing ? 'Cancel' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.profileImageContainer}>
            <ImagePicker
              imageUri={profileImage}
              onImageSelected={handleImageSelected}
              placeholder="Add Profile Photo"
              disabled={!isEditing || isLoading}
              size={120}
              borderRadius={60}
            />
          </View>

          <View style={styles.formContainer}>
            <View style={styles.nameRow}>
              <View style={styles.nameInputContainer}>
                <Text style={styles.label}>First Name</Text>
                <Controller
                  control={control}
                  name="firstName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[
                        styles.input,
                        !isEditing && styles.inputDisabled,
                        errors.firstName && styles.inputError,
                      ]}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      editable={isEditing && !isLoading}
                      placeholder="First name"
                      placeholderTextColor={colors.inputPlaceholder}
                    />
                  )}
                />
                {errors.firstName && (
                  <Text style={styles.fieldError}>{errors.firstName.message}</Text>
                )}
              </View>

              <View style={styles.nameInputContainer}>
                <Text style={styles.label}>Last Name</Text>
                <Controller
                  control={control}
                  name="lastName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      style={[
                        styles.input,
                        !isEditing && styles.inputDisabled,
                        errors.lastName && styles.inputError,
                      ]}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      editable={isEditing && !isLoading}
                      placeholder="Last name"
                      placeholderTextColor={colors.inputPlaceholder}
                    />
                  )}
                />
                {errors.lastName && (
                  <Text style={styles.fieldError}>{errors.lastName.message}</Text>
                )}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Display Name</Text>
              <Controller
                control={control}
                name="displayName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      !isEditing && styles.inputDisabled,
                      errors.displayName && styles.inputError,
                    ]}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    editable={isEditing && !isLoading}
                    placeholder="Display name"
                    placeholderTextColor={colors.inputPlaceholder}
                  />
                )}
              />
              {errors.displayName && (
                <Text style={styles.fieldError}>{errors.displayName.message}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      !isEditing && styles.inputDisabled,
                      errors.email && styles.inputError,
                    ]}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    editable={isEditing && !isLoading}
                    placeholder="Email address"
                    placeholderTextColor={colors.inputPlaceholder}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                )}
              />
              {errors.email && (
                <Text style={styles.fieldError}>{errors.email.message}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone</Text>
              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      !isEditing && styles.inputDisabled,
                      errors.phone && styles.inputError,
                    ]}
                    value={value || ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    editable={isEditing && !isLoading}
                    placeholder="Phone number (optional)"
                    placeholderTextColor={colors.inputPlaceholder}
                    keyboardType="phone-pad"
                  />
                )}
              />
              {errors.phone && (
                <Text style={styles.fieldError}>{errors.phone.message}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Bio</Text>
              <Controller
                control={control}
                name="bio"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.textArea,
                      !isEditing && styles.inputDisabled,
                      errors.bio && styles.inputError,
                    ]}
                    value={value || ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    editable={isEditing && !isLoading}
                    placeholder="Tell us about yourself (optional)"
                    placeholderTextColor={colors.inputPlaceholder}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                )}
              />
              {errors.bio && (
                <Text style={styles.fieldError}>{errors.bio.message}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Website</Text>
              <Controller
                control={control}
                name="website"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      !isEditing && styles.inputDisabled,
                      errors.website && styles.inputError,
                    ]}
                    value={value || ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    editable={isEditing && !isLoading}
                    placeholder="Website URL (optional)"
                    placeholderTextColor={colors.inputPlaceholder}
                    keyboardType="url"
                    autoCapitalize="none"
                  />
                )}
              />
              {errors.website && (
                <Text style={styles.fieldError}>{errors.website.message}</Text>
              )}
            </View>

            {isEditing && (
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSubmit(handleSave)}
                  disabled={isLoading}
                >
                  <Text style={styles.saveButtonText}>
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}
                  disabled={isLoading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              disabled={isLoading}
            >
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: dimensions.containerPadding.horizontal,
    paddingTop: dimensions.spacing.lg,
  },
  title: {
    fontSize: dimensions.fontSize.xxxl,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  editButton: {
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: dimensions.borderRadius.md,
    backgroundColor: colors.primary,
  },
  editButtonText: {
    color: colors.textOnPrimary,
    fontSize: dimensions.fontSize.sm,
    fontWeight: '600' as const,
  },
  profileImageContainer: {
    alignItems: 'center' as const,
    paddingVertical: dimensions.spacing.xl,
  },
  formContainer: {
    padding: dimensions.containerPadding.horizontal,
  },
  nameRow: {
    flexDirection: 'row' as const,
    gap: dimensions.spacing.md,
    marginBottom: dimensions.spacing.lg,
  },
  nameInputContainer: {
    flex: 1,
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
  textArea: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: dimensions.borderRadius.md,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.md,
    fontSize: dimensions.fontSize.md,
    backgroundColor: colors.inputBackground,
    color: colors.textPrimary,
  },
  inputDisabled: {
    backgroundColor: colors.gray100,
    color: colors.textSecondary,
  },
  inputError: {
    borderColor: colors.error,
  },
  fieldError: {
    color: colors.error,
    fontSize: dimensions.fontSize.sm,
    marginTop: dimensions.spacing.xs,
  },
  buttonContainer: {
    marginTop: dimensions.spacing.lg,
    gap: dimensions.spacing.md,
  },
  saveButton: {
    height: dimensions.buttonHeight.lg,
    backgroundColor: colors.primary,
    borderRadius: dimensions.borderRadius.md,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  saveButtonText: {
    color: colors.textOnPrimary,
    fontSize: dimensions.fontSize.md,
    fontWeight: '600' as const,
  },
  cancelButton: {
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
  footer: {
    padding: dimensions.containerPadding.horizontal,
    paddingTop: dimensions.spacing.xxl,
    paddingBottom: dimensions.spacing.xxl,
  },
  logoutButton: {
    height: dimensions.buttonHeight.lg,
    backgroundColor: colors.error,
    borderRadius: dimensions.borderRadius.md,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  logoutButtonText: {
    color: colors.white,
    fontSize: dimensions.fontSize.md,
    fontWeight: '600' as const,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: dimensions.containerPadding.horizontal,
  },
  errorText: {
    fontSize: dimensions.fontSize.lg,
    color: colors.error,
    textAlign: 'center' as const,
  },
};