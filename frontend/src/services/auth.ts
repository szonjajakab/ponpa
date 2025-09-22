import auth, { FirebaseAuthTypes, getAuth } from '@react-native-firebase/auth';
// import firestore from '@react-native-firebase/firestore';
import * as SecureStore from 'expo-secure-store';
import { User, LoginCredentials, RegisterData, ApiError } from '../types';
import { StorageKeys } from '../types';

class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Convert Firebase user to our User type
  private async convertFirebaseUser(firebaseUser: FirebaseAuthTypes.User): Promise<User> {
    // TODO: Get additional user data from Firestore when re-enabled
    /*
    const userDoc = await firestore()
      .collection('users')
      .doc(firebaseUser.uid)
      .get();

    const userData = userDoc.data();
    */

    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      emailVerified: firebaseUser.emailVerified,
      firstName: '', // userData?.firstName || '',
      lastName: '', // userData?.lastName || '',
      displayName: firebaseUser.displayName || '',
      photoURL: firebaseUser.photoURL || undefined,
      phone: firebaseUser.phoneNumber || undefined,
      dateOfBirth: undefined, // userData?.dateOfBirth?.toDate() || undefined,
      bio: undefined, // userData?.bio || undefined,
      website: undefined, // userData?.website || undefined,
      createdAt: new Date(), // userData?.createdAt?.toDate() || new Date(),
      updatedAt: new Date(), // userData?.updatedAt?.toDate() || new Date(),
    };
  }

  // Create user profile in Firestore - DISABLED
  private async createUserProfile(user: FirebaseAuthTypes.User, additionalData: Partial<User> = {}): Promise<void> {
    // TODO: Re-enable when Firestore is added back
    /*
    const userRef = firestore().collection('users').doc(user.uid);
    const snapshot = await userRef.get();

    if (!snapshot.exists) {
      const { email, displayName, photoURL } = user;
      const createdAt = new Date();

      try {
        await userRef.set({
          email,
          displayName: displayName || '',
          photoURL: photoURL || '',
          createdAt,
          updatedAt: createdAt,
          ...additionalData,
        });
      } catch (error) {
        console.error('Error creating user profile:', error);
        throw new Error('Failed to create user profile');
      }
    }
    */
    console.log('User profile creation disabled - Firestore not available');
  }

  // Login with email and password
  public async login(credentials: LoginCredentials): Promise<User> {
    try {
      const { email, password } = credentials;
      const result = await auth().signInWithEmailAndPassword(email, password);

      if (!result.user) {
        throw new Error('Login failed');
      }

      const user = await this.convertFirebaseUser(result.user);
      this.currentUser = user;

      // Store user data securely
      await this.storeUserData(user);

      return user;
    } catch (error: any) {
      console.error('Login error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Register new user
  public async register(data: RegisterData): Promise<User> {
    try {
      const { email, password, firstName, lastName } = data;
      const result = await auth().createUserWithEmailAndPassword(email, password);

      if (!result.user) {
        throw new Error('Registration failed');
      }

      // Create user profile with additional data
      await this.createUserProfile(result.user, {
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`,
      });

      // Send email verification
      await result.user.sendEmailVerification();

      const user = await this.convertFirebaseUser(result.user);
      this.currentUser = user;

      // Store user data securely
      await this.storeUserData(user);

      return user;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Logout user
  public async logout(): Promise<void> {
    try {
      await auth().signOut();
      this.currentUser = null;

      // Clear stored data
      await this.clearStoredData();
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error('Failed to logout');
    }
  }

  // Get current user
  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Check if user is authenticated
  public isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  // Send password reset email
  public async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await auth().sendPasswordResetEmail(email);
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Update user profile
  public async updateProfile(updates: Partial<User>): Promise<User> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      // Update Firestore profile - DISABLED
      /*
      const userRef = firestore().collection('users').doc(currentUser.uid);
      await userRef.update({
        ...updates,
        updatedAt: new Date(),
      });
      */
      console.log('Firestore profile update disabled');

      // Update Firebase Auth profile if needed
      if (updates.displayName || updates.photoURL) {
        await currentUser.updateProfile({
          displayName: updates.displayName,
          photoURL: updates.photoURL,
        });
      }

      // Get updated user data
      const updatedUser = await this.convertFirebaseUser(currentUser);
      this.currentUser = updatedUser;

      // Update stored data
      await this.storeUserData(updatedUser);

      return updatedUser;
    } catch (error: any) {
      console.error('Profile update error:', error);
      throw new Error('Failed to update profile');
    }
  }

  // Change password
  public async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = auth().currentUser;
      if (!user || !user.email) {
        throw new Error('No authenticated user');
      }

      // Re-authenticate user
      const credential = auth.EmailAuthProvider.credential(user.email, currentPassword);
      await user.reauthenticateWithCredential(credential);

      // Update password
      await user.updatePassword(newPassword);
    } catch (error: any) {
      console.error('Password change error:', error);
      throw this.handleAuthError(error);
    }
  }

  // Send email verification
  public async sendEmailVerification(): Promise<void> {
    try {
      const user = auth().currentUser;
      if (!user) {
        throw new Error('No authenticated user');
      }

      await user.sendEmailVerification();
    } catch (error: any) {
      console.error('Email verification error:', error);
      throw new Error('Failed to send verification email');
    }
  }

  // Initialize auth state on app start
  public async initializeAuth(): Promise<User | null> {
    try {
      // Check for stored user data first
      const storedUser = await this.getStoredUserData();
      if (storedUser) {
        this.currentUser = storedUser;
        return storedUser;
      }

      // Check Firebase auth state
      const firebaseUser = auth().currentUser;
      if (firebaseUser) {
        const user = await this.convertFirebaseUser(firebaseUser);
        this.currentUser = user;
        await this.storeUserData(user);
        return user;
      }

      return null;
    } catch (error) {
      console.error('Auth initialization error:', error);
      return null;
    }
  }

  // Store user data securely
  private async storeUserData(user: User): Promise<void> {
    try {
      await SecureStore.setItemAsync(StorageKeys.USER_DATA, JSON.stringify(user));
    } catch (error) {
      console.error('Error storing user data:', error);
    }
  }

  // Get stored user data
  private async getStoredUserData(): Promise<User | null> {
    try {
      const userData = await SecureStore.getItemAsync(StorageKeys.USER_DATA);
      if (userData) {
        const user = JSON.parse(userData);
        // Convert date strings back to Date objects
        user.createdAt = new Date(user.createdAt);
        user.updatedAt = new Date(user.updatedAt);
        if (user.dateOfBirth) {
          user.dateOfBirth = new Date(user.dateOfBirth);
        }
        return user;
      }
      return null;
    } catch (error) {
      console.error('Error getting stored user data:', error);
      return null;
    }
  }

  // Clear stored data
  private async clearStoredData(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(StorageKeys.USER_DATA);
      await SecureStore.deleteItemAsync(StorageKeys.AUTH_TOKEN);
      await SecureStore.deleteItemAsync(StorageKeys.REFRESH_TOKEN);
    } catch (error) {
      console.error('Error clearing stored data:', error);
    }
  }

  // Handle authentication errors
  private handleAuthError(error: any): ApiError {
    let message = 'An authentication error occurred';
    let code = error.code;

    switch (error.code) {
      case 'auth/user-not-found':
        message = 'No account found with this email address';
        break;
      case 'auth/wrong-password':
        message = 'Incorrect password';
        break;
      case 'auth/email-already-in-use':
        message = 'An account with this email already exists';
        break;
      case 'auth/weak-password':
        message = 'Password is too weak';
        break;
      case 'auth/invalid-email':
        message = 'Invalid email address';
        break;
      case 'auth/user-disabled':
        message = 'This account has been disabled';
        break;
      case 'auth/too-many-requests':
        message = 'Too many failed attempts. Please try again later';
        break;
      case 'auth/network-request-failed':
        message = 'Network error. Please check your connection';
        break;
      case 'auth/requires-recent-login':
        message = 'Please log in again to complete this action';
        break;
      default:
        message = error.message || message;
    }

    return {
      message,
      status: 400,
      code,
    };
  }

  // Auth state listener
  public onAuthStateChanged(callback: (user: User | null) => void) {
    return auth().onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const user = await this.convertFirebaseUser(firebaseUser);
          this.currentUser = user;
          await this.storeUserData(user);
          callback(user);
        } catch (error) {
          console.error('Error converting Firebase user:', error);
          callback(null);
        }
      } else {
        this.currentUser = null;
        await this.clearStoredData();
        callback(null);
      }
    });
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();
export default authService;