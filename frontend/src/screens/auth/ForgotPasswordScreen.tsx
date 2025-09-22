import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';

export const ForgotPasswordScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>This feature will be implemented soon</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
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
  },
};