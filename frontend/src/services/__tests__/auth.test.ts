import authService from '../auth';
import { StorageKeys } from '../../types';

// Mock Firebase Auth
const mockSignInWithEmailAndPassword = jest.fn();
const mockCreateUserWithEmailAndPassword = jest.fn();
const mockSignOut = jest.fn();
const mockSendPasswordResetEmail = jest.fn();
const mockSendEmailVerification = jest.fn();
const mockUpdateProfile = jest.fn();
const mockUpdatePassword = jest.fn();
const mockReauthenticateWithCredential = jest.fn();
const mockOnAuthStateChanged = jest.fn();

const mockFirebaseUser = {
  uid: 'test-uid',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg',
  phoneNumber: '+1234567890',
  emailVerified: true,
  sendEmailVerification: mockSendEmailVerification,
  updateProfile: mockUpdateProfile,
  updatePassword: mockUpdatePassword,
  reauthenticateWithCredential: mockReauthenticateWithCredential,
};

const mockAuth = {
  currentUser: null,
  signInWithEmailAndPassword: mockSignInWithEmailAndPassword,
  createUserWithEmailAndPassword: mockCreateUserWithEmailAndPassword,
  signOut: mockSignOut,
  sendPasswordResetEmail: mockSendPasswordResetEmail,
  onAuthStateChanged: mockOnAuthStateChanged,
  EmailAuthProvider: {
    credential: jest.fn().mockReturnValue('mock-credential'),
  },
};

jest.mock('@react-native-firebase/auth', () => {
  return () => mockAuth;
});

// Mock Expo SecureStore
const mockSetItemAsync = jest.fn();
const mockGetItemAsync = jest.fn();
const mockDeleteItemAsync = jest.fn();

jest.mock('expo-secure-store', () => ({
  setItemAsync: mockSetItemAsync,
  getItemAsync: mockGetItemAsync,
  deleteItemAsync: mockDeleteItemAsync,
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.currentUser = null;
  });

  describe('Singleton pattern', () => {
    it('returns the same instance', () => {
      const instance1 = authService;
      const instance2 = authService;

      expect(instance1).toBe(instance2);
    });
  });

  describe('login', () => {
    const credentials = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('successfully logs in user with valid credentials', async () => {
      mockSignInWithEmailAndPassword.mockResolvedValueOnce({
        user: mockFirebaseUser,
      });
      mockSetItemAsync.mockResolvedValueOnce(undefined);

      const user = await authService.login(credentials);

      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
        credentials.email,
        credentials.password
      );
      expect(user).toEqual(
        expect.objectContaining({
          uid: 'test-uid',
          email: 'test@example.com',
          emailVerified: true,
        })
      );
      expect(mockSetItemAsync).toHaveBeenCalledWith(
        StorageKeys.USER_DATA,
        expect.any(String)
      );
    });

    it('throws error when login fails', async () => {
      const error = new Error('Invalid credentials');
      error.code = 'auth/wrong-password';
      mockSignInWithEmailAndPassword.mockRejectedValueOnce(error);

      await expect(authService.login(credentials)).rejects.toEqual(
        expect.objectContaining({
          message: 'Incorrect password',
          code: 'auth/wrong-password',
        })
      );
    });

    it('throws error when no user is returned', async () => {
      mockSignInWithEmailAndPassword.mockResolvedValueOnce({ user: null });

      await expect(authService.login(credentials)).rejects.toEqual(
        expect.objectContaining({
          message: 'Login failed',
        })
      );
    });
  });

  describe('register', () => {
    const registerData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      termsAccepted: true,
      privacyAccepted: true,
    };

    it('successfully registers new user', async () => {
      mockCreateUserWithEmailAndPassword.mockResolvedValueOnce({
        user: mockFirebaseUser,
      });
      mockSendEmailVerification.mockResolvedValueOnce(undefined);
      mockSetItemAsync.mockResolvedValueOnce(undefined);

      const user = await authService.register(registerData);

      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
        registerData.email,
        registerData.password
      );
      expect(mockSendEmailVerification).toHaveBeenCalled();
      expect(user).toEqual(
        expect.objectContaining({
          uid: 'test-uid',
          email: 'test@example.com',
        })
      );
    });

    it('throws error when registration fails', async () => {
      const error = new Error('Email already in use');
      error.code = 'auth/email-already-in-use';
      mockCreateUserWithEmailAndPassword.mockRejectedValueOnce(error);

      await expect(authService.register(registerData)).rejects.toEqual(
        expect.objectContaining({
          message: 'An account with this email already exists',
          code: 'auth/email-already-in-use',
        })
      );
    });

    it('throws error when no user is returned', async () => {
      mockCreateUserWithEmailAndPassword.mockResolvedValueOnce({ user: null });

      await expect(authService.register(registerData)).rejects.toEqual(
        expect.objectContaining({
          message: 'Registration failed',
        })
      );
    });
  });

  describe('logout', () => {
    it('successfully logs out user', async () => {
      mockSignOut.mockResolvedValueOnce(undefined);
      mockDeleteItemAsync.mockResolvedValueOnce(undefined);

      await authService.logout();

      expect(mockSignOut).toHaveBeenCalled();
      expect(mockDeleteItemAsync).toHaveBeenCalledWith(StorageKeys.USER_DATA);
      expect(mockDeleteItemAsync).toHaveBeenCalledWith(StorageKeys.AUTH_TOKEN);
      expect(mockDeleteItemAsync).toHaveBeenCalledWith(StorageKeys.REFRESH_TOKEN);
    });

    it('throws error when logout fails', async () => {
      const error = new Error('Logout failed');
      mockSignOut.mockRejectedValueOnce(error);

      await expect(authService.logout()).rejects.toThrow('Failed to logout');
    });
  });

  describe('getCurrentUser', () => {
    it('returns null when no user is logged in', () => {
      const user = authService.getCurrentUser();
      expect(user).toBeNull();
    });

    it('returns current user when logged in', async () => {
      mockSignInWithEmailAndPassword.mockResolvedValueOnce({
        user: mockFirebaseUser,
      });
      mockSetItemAsync.mockResolvedValueOnce(undefined);

      await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      const user = authService.getCurrentUser();
      expect(user).toEqual(
        expect.objectContaining({
          uid: 'test-uid',
          email: 'test@example.com',
        })
      );
    });
  });

  describe('isAuthenticated', () => {
    it('returns false when no user is logged in', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('returns true when user is logged in', async () => {
      mockSignInWithEmailAndPassword.mockResolvedValueOnce({
        user: mockFirebaseUser,
      });
      mockSetItemAsync.mockResolvedValueOnce(undefined);

      await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(authService.isAuthenticated()).toBe(true);
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('successfully sends password reset email', async () => {
      mockSendPasswordResetEmail.mockResolvedValueOnce(undefined);

      await authService.sendPasswordResetEmail('test@example.com');

      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('throws error when sending fails', async () => {
      const error = new Error('User not found');
      error.code = 'auth/user-not-found';
      mockSendPasswordResetEmail.mockRejectedValueOnce(error);

      await expect(
        authService.sendPasswordResetEmail('test@example.com')
      ).rejects.toEqual(
        expect.objectContaining({
          message: 'No account found with this email address',
          code: 'auth/user-not-found',
        })
      );
    });
  });

  describe('updateProfile', () => {
    beforeEach(() => {
      mockAuth.currentUser = mockFirebaseUser;
    });

    it('successfully updates user profile', async () => {
      mockUpdateProfile.mockResolvedValueOnce(undefined);
      mockSetItemAsync.mockResolvedValueOnce(undefined);

      const updates = {
        displayName: 'Updated Name',
        photoURL: 'https://example.com/new-photo.jpg',
      };

      const user = await authService.updateProfile(updates);

      expect(mockUpdateProfile).toHaveBeenCalledWith({
        displayName: 'Updated Name',
        photoURL: 'https://example.com/new-photo.jpg',
      });
      expect(user).toEqual(
        expect.objectContaining({
          displayName: 'Test User',
        })
      );
    });

    it('throws error when no user is authenticated', async () => {
      mockAuth.currentUser = null;

      await expect(
        authService.updateProfile({ displayName: 'Test' })
      ).rejects.toThrow('No authenticated user');
    });

    it('throws error when update fails', async () => {
      const error = new Error('Update failed');
      mockUpdateProfile.mockRejectedValueOnce(error);

      await expect(
        authService.updateProfile({ displayName: 'Test' })
      ).rejects.toThrow('Failed to update profile');
    });
  });

  describe('changePassword', () => {
    beforeEach(() => {
      mockAuth.currentUser = mockFirebaseUser;
    });

    it('successfully changes password', async () => {
      mockReauthenticateWithCredential.mockResolvedValueOnce(undefined);
      mockUpdatePassword.mockResolvedValueOnce(undefined);

      await authService.changePassword('oldPassword', 'newPassword');

      expect(mockAuth.EmailAuthProvider.credential).toHaveBeenCalledWith(
        'test@example.com',
        'oldPassword'
      );
      expect(mockReauthenticateWithCredential).toHaveBeenCalledWith('mock-credential');
      expect(mockUpdatePassword).toHaveBeenCalledWith('newPassword');
    });

    it('throws error when no user is authenticated', async () => {
      mockAuth.currentUser = null;

      await expect(
        authService.changePassword('old', 'new')
      ).rejects.toThrow('No authenticated user');
    });

    it('throws error when user has no email', async () => {
      mockAuth.currentUser = { ...mockFirebaseUser, email: null };

      await expect(
        authService.changePassword('old', 'new')
      ).rejects.toThrow('No authenticated user');
    });

    it('handles authentication errors', async () => {
      const error = new Error('Wrong password');
      error.code = 'auth/wrong-password';
      mockReauthenticateWithCredential.mockRejectedValueOnce(error);

      await expect(
        authService.changePassword('wrongPassword', 'newPassword')
      ).rejects.toEqual(
        expect.objectContaining({
          message: 'Incorrect password',
          code: 'auth/wrong-password',
        })
      );
    });
  });

  describe('sendEmailVerification', () => {
    beforeEach(() => {
      mockAuth.currentUser = mockFirebaseUser;
    });

    it('successfully sends email verification', async () => {
      mockSendEmailVerification.mockResolvedValueOnce(undefined);

      await authService.sendEmailVerification();

      expect(mockSendEmailVerification).toHaveBeenCalled();
    });

    it('throws error when no user is authenticated', async () => {
      mockAuth.currentUser = null;

      await expect(authService.sendEmailVerification()).rejects.toThrow(
        'No authenticated user'
      );
    });

    it('throws error when sending fails', async () => {
      const error = new Error('Send failed');
      mockSendEmailVerification.mockRejectedValueOnce(error);

      await expect(authService.sendEmailVerification()).rejects.toThrow(
        'Failed to send verification email'
      );
    });
  });

  describe('initializeAuth', () => {
    it('returns stored user data when available', async () => {
      const storedUserData = JSON.stringify({
        uid: 'stored-uid',
        email: 'stored@example.com',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      mockGetItemAsync.mockResolvedValueOnce(storedUserData);

      const user = await authService.initializeAuth();

      expect(user).toEqual(
        expect.objectContaining({
          uid: 'stored-uid',
          email: 'stored@example.com',
        })
      );
    });

    it('returns firebase user when no stored data but firebase user exists', async () => {
      mockGetItemAsync.mockResolvedValueOnce(null);
      mockAuth.currentUser = mockFirebaseUser;
      mockSetItemAsync.mockResolvedValueOnce(undefined);

      const user = await authService.initializeAuth();

      expect(user).toEqual(
        expect.objectContaining({
          uid: 'test-uid',
          email: 'test@example.com',
        })
      );
    });

    it('returns null when no user data is available', async () => {
      mockGetItemAsync.mockResolvedValueOnce(null);
      mockAuth.currentUser = null;

      const user = await authService.initializeAuth();

      expect(user).toBeNull();
    });

    it('returns null when initialization fails', async () => {
      mockGetItemAsync.mockRejectedValueOnce(new Error('Storage error'));

      const user = await authService.initializeAuth();

      expect(user).toBeNull();
    });
  });

  describe('onAuthStateChanged', () => {
    it('calls callback with converted user when firebase user exists', async () => {
      const callback = jest.fn();
      mockSetItemAsync.mockResolvedValueOnce(undefined);

      authService.onAuthStateChanged(callback);

      // Simulate auth state change
      const authStateCallback = mockOnAuthStateChanged.mock.calls[0][0];
      await authStateCallback(mockFirebaseUser);

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          uid: 'test-uid',
          email: 'test@example.com',
        })
      );
    });

    it('calls callback with null when no firebase user', async () => {
      const callback = jest.fn();
      mockDeleteItemAsync.mockResolvedValueOnce(undefined);

      authService.onAuthStateChanged(callback);

      const authStateCallback = mockOnAuthStateChanged.mock.calls[0][0];
      await authStateCallback(null);

      expect(callback).toHaveBeenCalledWith(null);
    });

    it('calls callback with null when user conversion fails', async () => {
      const callback = jest.fn();

      authService.onAuthStateChanged(callback);

      const authStateCallback = mockOnAuthStateChanged.mock.calls[0][0];
      // Mock conversion failure by making setItemAsync throw
      mockSetItemAsync.mockRejectedValueOnce(new Error('Storage error'));

      await authStateCallback(mockFirebaseUser);

      expect(callback).toHaveBeenCalledWith(null);
    });
  });

  describe('error handling', () => {
    it('correctly maps Firebase auth error codes', async () => {
      const testCases = [
        {
          code: 'auth/user-not-found',
          expectedMessage: 'No account found with this email address',
        },
        {
          code: 'auth/wrong-password',
          expectedMessage: 'Incorrect password',
        },
        {
          code: 'auth/email-already-in-use',
          expectedMessage: 'An account with this email already exists',
        },
        {
          code: 'auth/weak-password',
          expectedMessage: 'Password is too weak',
        },
        {
          code: 'auth/invalid-email',
          expectedMessage: 'Invalid email address',
        },
        {
          code: 'auth/user-disabled',
          expectedMessage: 'This account has been disabled',
        },
        {
          code: 'auth/too-many-requests',
          expectedMessage: 'Too many failed attempts. Please try again later',
        },
        {
          code: 'auth/network-request-failed',
          expectedMessage: 'Network error. Please check your connection',
        },
        {
          code: 'auth/requires-recent-login',
          expectedMessage: 'Please log in again to complete this action',
        },
      ];

      for (const testCase of testCases) {
        const error = new Error('Firebase error');
        error.code = testCase.code;
        mockSignInWithEmailAndPassword.mockRejectedValueOnce(error);

        await expect(
          authService.login({ email: 'test@example.com', password: 'password' })
        ).rejects.toEqual(
          expect.objectContaining({
            message: testCase.expectedMessage,
            code: testCase.code,
          })
        );
      }
    });

    it('uses default message for unknown error codes', async () => {
      const error = new Error('Unknown error');
      error.code = 'auth/unknown-error';
      mockSignInWithEmailAndPassword.mockRejectedValueOnce(error);

      await expect(
        authService.login({ email: 'test@example.com', password: 'password' })
      ).rejects.toEqual(
        expect.objectContaining({
          message: 'Unknown error',
        })
      );
    });
  });
});