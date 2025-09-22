import React from 'react';
import { View, SafeAreaView, KeyboardAvoidingView, Platform, TouchableOpacity, Text } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';
import { LoginForm } from '../../components/forms/LoginForm';
import { AuthStackParamList } from '../../types';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const handleLoginSuccess = () => {
    // Navigation will be handled by the auth state change in AppNavigator
    console.log('Login successful');
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleGoToRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          <LoginForm
            onSuccess={handleLoginSuccess}
            onForgotPassword={handleForgotPassword}
          />

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleGoToRegister}
            >
              <Text style={styles.registerText}>
                Don't have an account?{' '}
                <Text style={styles.registerLinkText}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
  content: {
    flex: 1,
    paddingTop: dimensions.spacing.xl,
  },
  footer: {
    padding: dimensions.containerPadding.horizontal,
    paddingBottom: dimensions.spacing.lg,
  },
  registerButton: {
    padding: dimensions.spacing.md,
    alignItems: 'center' as const,
  },
  registerText: {
    fontSize: dimensions.fontSize.sm,
    color: colors.textSecondary,
  },
  registerLinkText: {
    color: colors.primary,
    fontWeight: '600' as const,
  },
};