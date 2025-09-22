import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { dimensions } from '../constants/dimensions';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { MainStackParamList } from '../types';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator<MainStackParamList>();

// Placeholder screens for future implementation
const HomeScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: 24, color: colors.textPrimary }}>Home</Text>
    <Text style={{ fontSize: 16, color: colors.textSecondary, marginTop: 8 }}>Coming Soon</Text>
  </View>
);

const WardrobeScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: 24, color: colors.textPrimary }}>Wardrobe</Text>
    <Text style={{ fontSize: 16, color: colors.textSecondary, marginTop: 8 }}>Coming Soon</Text>
  </View>
);

const OutfitsScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: 24, color: colors.textPrimary }}>Outfits</Text>
    <Text style={{ fontSize: 16, color: colors.textSecondary, marginTop: 8 }}>Coming Soon</Text>
  </View>
);

const AnalyticsScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: 24, color: colors.textPrimary }}>Analytics</Text>
    <Text style={{ fontSize: 16, color: colors.textSecondary, marginTop: 8 }}>Coming Soon</Text>
  </View>
);

const TryOnScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: 24, color: colors.textPrimary }}>Try On</Text>
    <Text style={{ fontSize: 16, color: colors.textSecondary, marginTop: 8 }}>Coming Soon</Text>
  </View>
);

// Tab Navigator
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: dimensions.tabBarHeight,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: dimensions.fontSize.xs,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Wardrobe"
        component={WardrobeScreen}
        options={{
          title: 'Wardrobe',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>👗</Text>
          ),
        }}
      />
      <Tab.Screen
        name="TryOn"
        component={TryOnScreen}
        options={{
          title: 'Try On',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>📸</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Outfits"
        component={OutfitsScreen}
        options={{
          title: 'Outfits',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>✨</Text>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Main Stack Navigator (for modals and detailed screens)
export const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      <Stack.Screen
        name="TabNavigator"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      {/* Future modal screens will be added here */}
      {/*
      <Stack.Screen
        name="AddItem"
        component={AddItemScreen}
        options={{
          presentation: 'modal',
          title: 'Add Item',
        }}
      />
      <Stack.Screen
        name="ItemDetails"
        component={ItemDetailsScreen}
        options={{
          title: 'Item Details',
        }}
      />
      <Stack.Screen
        name="EditItem"
        component={EditItemScreen}
        options={{
          title: 'Edit Item',
        }}
      />
      <Stack.Screen
        name="CreateOutfit"
        component={CreateOutfitScreen}
        options={{
          presentation: 'modal',
          title: 'Create Outfit',
        }}
      />
      <Stack.Screen
        name="OutfitDetails"
        component={OutfitDetailsScreen}
        options={{
          title: 'Outfit Details',
        }}
      />
      <Stack.Screen
        name="EditOutfit"
        component={EditOutfitScreen}
        options={{
          title: 'Edit Outfit',
        }}
      />
      <Stack.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          title: 'Analytics',
        }}
      />
      */}
    </Stack.Navigator>
  );
};