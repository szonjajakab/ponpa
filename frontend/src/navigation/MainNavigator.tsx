import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { dimensions } from '../constants/dimensions';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { WardrobeScreen } from '../screens/wardrobe/WardrobeScreen';
import { AddItemScreen } from '../screens/wardrobe/AddItemScreen';
import { EditItemScreen } from '../screens/wardrobe/EditItemScreen';
import { ItemDetailsScreen } from '../screens/wardrobe/ItemDetailsScreen';
import { OutfitsScreen } from '../screens/outfits/OutfitsScreen';
import { CreateOutfitScreen } from '../screens/outfits/CreateOutfitScreen';
import { EditOutfitScreen } from '../screens/outfits/EditOutfitScreen';
import { OutfitDetailsScreen } from '../screens/outfits/OutfitDetailsScreen';
import { OutfitFilterModal } from '../screens/outfits/OutfitFilterModal';
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

// Wardrobe will use the imported WardrobeScreen component

// OutfitsScreen is now imported from the actual implementation

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
      {/* Wardrobe Screens */}
      <Stack.Screen
        name="AddItem"
        component={AddItemScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ItemDetails"
        component={ItemDetailsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="EditItem"
        component={EditItemScreen}
        options={{
          headerShown: false,
        }}
      />
      {/* Outfit Screens */}
      <Stack.Screen
        name="CreateOutfit"
        component={CreateOutfitScreen}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="OutfitDetails"
        component={OutfitDetailsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="EditOutfit"
        component={EditOutfitScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="OutfitFilterModal"
        component={OutfitFilterModal}
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
      {/* Future screens for analytics, etc. */}
      {/*
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