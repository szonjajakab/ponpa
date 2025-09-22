import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';
import { authSchemas, LoginFormData } from '../../utils/validators';
import { useAuth } from '../../store/useStore';

interface LoginFormProps {
  onSuccess?: () => void;
  onForgotPassword?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onForgotPassword,
}) => {
  const { login, isLoading, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormData>({
    resolver: yupResolver(authSchemas.login),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      onSuccess?.();
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Sign in to continue to your wardrobe</Text>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.formContainer}>
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
                  placeholder="Enter your password"
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

        <TouchableOpacity
          style={styles.forgotPasswordButton}
          onPress={onForgotPassword}
          disabled={isLoading}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.loginButton,
            (!isValid || isLoading) && styles.loginButtonDisabled,
          ]}
          onPress={handleSubmit(onSubmit)}
          disabled={!isValid || isLoading}
        >
          <Text style={styles.loginButtonText}>
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
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
  forgotPasswordButton: {
    alignSelf: 'flex-end' as const,
    marginBottom: dimensions.spacing.xl,
  },
  forgotPasswordText: {
    color: colors.primary,
    fontSize: dimensions.fontSize.sm,
    fontWeight: '600' as const,
  },
  loginButton: {
    height: dimensions.buttonHeight.lg,
    backgroundColor: colors.primary,
    borderRadius: dimensions.borderRadius.md,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  loginButtonDisabled: {
    backgroundColor: colors.gray400,
  },
  loginButtonText: {
    color: colors.textOnPrimary,
    fontSize: dimensions.fontSize.md,
    fontWeight: '600' as const,
  },
};