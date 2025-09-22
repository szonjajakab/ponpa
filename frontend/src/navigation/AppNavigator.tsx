import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, ActivityIndicator } from 'react-native';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { useAuth, initializeApp } from '../store/useStore';
import { colors } from '../constants/colors';
import { dimensions } from '../constants/dimensions';
import { RootStackParamList } from '../types';

const Stack = createStackNavigator<RootStackParamList>();

// Loading screen component
const LoadingScreen = () => (
  <View style={{
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  }}>
    <ActivityIndicator size="large" color={colors.primary} />
    <Text style={{
      marginTop: dimensions.spacing.md,
      fontSize: dimensions.fontSize.md,
      color: colors.textSecondary,
    }}>
      Loading...
    </Text>
  </View>
);

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    initializeApp();
  }, []);

  // Show loading screen while initializing
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
        }}
      >
        {isAuthenticated && user ? (
          <Stack.Screen
            name="Main"
            component={MainNavigator}
            options={{
              title: 'Main App',
            }}
          />
        ) : (
          <Stack.Screen
            name="Auth"
            component={AuthNavigator}
            options={{
              title: 'Authentication',
            }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};