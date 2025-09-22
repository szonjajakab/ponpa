import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase manually if no apps exist
const initializeFirebase = async () => {
  try {
    console.log('Checking Firebase apps...');

    // Check if Firebase is already initialized (avoid multiple instances)
    if (!firebase.apps.length) {
      console.log('No Firebase apps found. Initializing manually...');
      console.log('Config:', {
        projectId: firebaseConfig.projectId,
        apiKey: firebaseConfig.apiKey ? 'Set' : 'Missing',
        appId: firebaseConfig.appId ? 'Set' : 'Missing'
      });

      // Initialize Firebase app manually
      const app = await firebase.initializeApp(firebaseConfig);
      console.log('Firebase app initialized manually:', app.name);
    } else {
      console.log('Firebase apps found:', firebase.apps.length);
      console.log('Using existing Firebase app');
    }

    // Get the default app
    const defaultApp = firebase.app();
    console.log('Default Firebase app:', defaultApp.name, defaultApp.options?.projectId);

    // Test auth
    const authInstance = auth();
    console.log('Auth instance created successfully');

    // Test if Firebase is working
    const currentUser = authInstance.currentUser;
    console.log('Firebase initialization successful. Current user:', currentUser ? 'Logged in' : 'Not logged in');

    return authInstance;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    console.error('Error details:', error instanceof Error ? error.message : String(error));
    throw error;
  }
};

export { initializeFirebase };
export default initializeFirebase;