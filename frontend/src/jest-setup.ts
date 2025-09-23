import 'react-native-gesture-handler/jestSetup';

// Mock react-native modules
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock expo modules
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
}));

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  NavigationContainer: ({ children }: { children: React.ReactNode }) => children,
}));

// Silence warnings during tests
const originalConsoleWarn = console.warn;
console.warn = (message: string) => {
  if (
    message.includes('componentWillReceiveProps') ||
    message.includes('componentWillMount') ||
    message.includes('Warning: React.createElement')
  ) {
    return;
  }
  originalConsoleWarn(message);
};

// Mock firebase
jest.mock('@react-native-firebase/auth', () => ({
  auth: jest.fn(),
}));

// Global test setup
beforeEach(() => {
  jest.clearAllMocks();
});