import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';
import { authSchemas, RegisterFormData } from '../../utils/validators';
import { useAuth } from '../../store/useStore';

interface RegisterFormProps {
  onSuccess?: () => void;
  onBackToLogin?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onBackToLogin,
}) => {
  const { register, isLoading, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(authSchemas.register),
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      termsAccepted: false,
      privacyAccepted: false,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await register(data);
      Alert.alert(
        'Registration Successful',
        'Please check your email to verify your account.',
        [{ text: 'OK', onPress: onSuccess }]
      );
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join us to build your perfect wardrobe</Text>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

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
                    errors.firstName && styles.inputError,
                  ]}
                  placeholder="First name"
                  placeholderTextColor={colors.inputPlaceholder}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="words"
                  editable={!isLoading}
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
                    errors.lastName && styles.inputError,
                  ]}
                  placeholder="Last name"
                  placeholderTextColor={colors.inputPlaceholder}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              )}
            />
            {errors.lastName && (
              <Text style={styles.fieldError}>{errors.lastName.message}</Text>
            )}
          </View>
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
                  errors.email && styles.inputError,
                ]}
                placeholder="Enter your email"
                placeholderTextColor={colors.inputPlaceholder}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            )}
          />
          {errors.email && (
            <Text style={styles.fieldError}>{errors.email.message}</Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.passwordInput,
                    errors.password && styles.inputError,
                  ]}
                  placeholder="Create a password"
                  placeholderTextColor={colors.inputPlaceholder}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              )}
            />
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              <Text style={styles.passwordToggleText}>
                {showPassword ? 'Hide' : 'Show'}
              </Text>
            </TouchableOpacity>
          </View>
          {errors.password && (
            <Text style={styles.fieldError}>{errors.password.message}</Text>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.passwordContainer}>
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.passwordInput,
                    errors.confirmPassword && styles.inputError,
                  ]}
                  placeholder="Confirm your password"
                  placeholderTextColor={colors.inputPlaceholder}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              )}
            />
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isLoading}
            >
              <Text style={styles.passwordToggleText}>
                {showConfirmPassword ? 'Hide' : 'Show'}
              </Text>
            </TouchableOpacity>
          </View>
          {errors.confirmPassword && (
            <Text style={styles.fieldError}>{errors.confirmPassword.message}</Text>
          )}
        </View>

        <View style={styles.checkboxContainer}>
          <Controller
            control={control}
            name="termsAccepted"
            render={({ field: { onChange, value } }) => (
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => onChange(!value)}
                disabled={isLoading}
              >
                <View style={[styles.checkbox, value && styles.checkboxChecked]}>
                  {value && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxText}>
                  I agree to the{' '}
                  <Text style={styles.linkText}>Terms and Conditions</Text>
                </Text>
              </TouchableOpacity>
            )}
          />
          {errors.termsAccepted && (
            <Text style={styles.fieldError}>{errors.termsAccepted.message}</Text>
          )}
        </View>

        <View style={styles.checkboxContainer}>
          <Controller
            control={control}
            name="privacyAccepted"
            render={({ field: { onChange, value } }) => (
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => onChange(!value)}
                disabled={isLoading}
              >
                <View style={[styles.checkbox, value && styles.checkboxChecked]}>
                  {value && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxText}>
                  I agree to the{' '}
                  <Text style={styles.linkText}>Privacy Policy</Text>
                </Text>
              </TouchableOpacity>
            )}
          />
          {errors.privacyAccepted && (
            <Text style={styles.fieldError}>{errors.privacyAccepted.message}</Text>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.registerButton,
            (!isValid || isLoading) && styles.registerButtonDisabled,
          ]}
          onPress={handleSubmit(onSubmit)}
          disabled={!isValid || isLoading}
        >
          <Text style={styles.registerButtonText}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backToLoginButton}
          onPress={onBackToLogin}
          disabled={isLoading}
        >
          <Text style={styles.backToLoginText}>
            Already have an account?{' '}
            <Text style={styles.linkText}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = {
  container: {
    flex: 1,
    padding: dimensions.containerPadding.horizontal,
  },
  title: {
    fontSize: dimensions.fontSize.xxxl,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    textAlign: 'center' as const,
    marginBottom: dimensions.spacing.sm,
  },
  subtitle: {
    fontSize: dimensions.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    marginBottom: dimensions.spacing.xl,
  },
  errorContainer: {
    backgroundColor: colors.errorLight,
    padding: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    marginBottom: dimensions.spacing.lg,
  },
  errorText: {
    color: colors.error,
    fontSize: dimensions.fontSize.sm,
    textAlign: 'center' as const,
  },
  formContainer: {
    paddingBottom: dimensions.spacing.xxl,
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
  inputError: {
    borderColor: colors.error,
  },
  passwordContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: dimensions.borderRadius.md,
    backgroundColor: colors.inputBackground,
  },
  passwordInput: {
    flex: 1,
    height: dimensions.inputHeight.md,
    paddingHorizontal: dimensions.spacing.md,
    fontSize: dimensions.fontSize.md,
    color: colors.textPrimary,
  },
  passwordToggle: {
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
  },
  passwordToggleText: {
    color: colors.primary,
    fontSize: dimensions.fontSize.sm,
    fontWeight: '600' as const,
  },
  fieldError: {
    color: colors.error,
    fontSize: dimensions.fontSize.sm,
    marginTop: dimensions.spacing.xs,
  },
  checkboxContainer: {
    marginBottom: dimensions.spacing.md,
  },
  checkboxRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    borderRadius: 4,
    marginRight: dimensions.spacing.sm,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.inputBackground,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold' as const,
  },
  checkboxText: {
    flex: 1,
    fontSize: dimensions.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  linkText: {
    color: colors.primary,
    fontWeight: '600' as const,
  },
  registerButton: {
    height: dimensions.buttonHeight.lg,
    backgroundColor: colors.primary,
    borderRadius: dimensions.borderRadius.md,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginTop: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.md,
  },
  registerButtonDisabled: {
    backgroundColor: colors.gray400,
  },
  registerButtonText: {
    color: colors.textOnPrimary,
    fontSize: dimensions.fontSize.md,
    fontWeight: '600' as const,
  },
  backToLoginButton: {
    padding: dimensions.spacing.md,
    alignItems: 'center' as const,
  },
  backToLoginText: {
    fontSize: dimensions.fontSize.sm,
    color: colors.textSecondary,
  },
};