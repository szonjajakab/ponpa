import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppNavigator } from './src/navigation/AppNavigator';
import { initializeFirebase } from './src/config/firebase';

export default function App() {
  useEffect(() => {
    // Initialize Firebase when app starts
    const initFirebase = async () => {
      try {
        await initializeFirebase();
      } catch (error) {
        console.error('Failed to initialize Firebase:', error);
      }
    };

    initFirebase();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppNavigator />
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
