import React from 'react';
import { View, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';
import { RegisterForm } from '../../components/forms/RegisterForm';
import { AuthStackParamList } from '../../types';

type RegisterScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>;

interface RegisterScreenProps {
  navigation: RegisterScreenNavigationProp;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const handleRegistrationSuccess = () => {
    // Navigation will be handled by the auth state change in AppNavigator
    console.log('Registration successful');
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          <RegisterForm
            onSuccess={handleRegistrationSuccess}
            onBackToLogin={handleBackToLogin}
          />
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
};