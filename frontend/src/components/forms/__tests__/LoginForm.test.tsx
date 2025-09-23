import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { LoginForm } from '../LoginForm';

// Mock the auth store
const mockLogin = jest.fn();
const mockUseAuth = {
  login: mockLogin,
  isLoading: false,
  error: null,
};

jest.mock('../../store/useStore', () => ({
  useAuth: () => mockUseAuth,
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('LoginForm', () => {
  const mockOnSuccess = jest.fn();
  const mockOnForgotPassword = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.isLoading = false;
    mockUseAuth.error = null;
  });

  describe('Rendering', () => {
    it('renders form elements correctly', () => {
      const { getByText, getByPlaceholderText } = render(
        <LoginForm onSuccess={mockOnSuccess} onForgotPassword={mockOnForgotPassword} />
      );

      expect(getByText('Welcome Back')).toBeTruthy();
      expect(getByText('Sign in to continue to your wardrobe')).toBeTruthy();
      expect(getByText('Email')).toBeTruthy();
      expect(getByText('Password')).toBeTruthy();
      expect(getByPlaceholderText('Enter your email')).toBeTruthy();
      expect(getByPlaceholderText('Enter your password')).toBeTruthy();
      expect(getByText('Sign In')).toBeTruthy();
      expect(getByText('Forgot Password?')).toBeTruthy();
    });

    it('renders loading state correctly', () => {
      mockUseAuth.isLoading = true;

      const { getByText } = render(
        <LoginForm onSuccess={mockOnSuccess} onForgotPassword={mockOnForgotPassword} />
      );

      expect(getByText('Signing In...')).toBeTruthy();
    });

    it('renders error message when error exists', () => {
      mockUseAuth.error = 'Authentication failed';

      const { getByText } = render(
        <LoginForm onSuccess={mockOnSuccess} onForgotPassword={mockOnForgotPassword} />
      );

      expect(getByText('Authentication failed')).toBeTruthy();
    });
  });

  describe('Form validation', () => {
    it('shows validation errors for empty fields', async () => {
      const { getByText, getByPlaceholderText } = render(
        <LoginForm onSuccess={mockOnSuccess} onForgotPassword={mockOnForgotPassword} />
      );

      const emailInput = getByPlaceholderText('Enter your email');
      const passwordInput = getByPlaceholderText('Enter your password');

      // Trigger validation by touching and blurring fields
      fireEvent.changeText(emailInput, '');
      fireEvent(emailInput, 'blur');
      fireEvent.changeText(passwordInput, '');
      fireEvent(passwordInput, 'blur');

      await waitFor(() => {
        expect(getByText('Email is required')).toBeTruthy();
        expect(getByText('Password is required')).toBeTruthy();
      });
    });

    it('shows validation error for invalid email format', async () => {
      const { getByText, getByPlaceholderText } = render(
        <LoginForm onSuccess={mockOnSuccess} onForgotPassword={mockOnForgotPassword} />
      );

      const emailInput = getByPlaceholderText('Enter your email');

      fireEvent.changeText(emailInput, 'invalid-email');
      fireEvent(emailInput, 'blur');

      await waitFor(() => {
        expect(getByText('Invalid email format')).toBeTruthy();
      });
    });

    it('disables submit button when form is invalid', async () => {
      const { getByText, getByPlaceholderText } = render(
        <LoginForm onSuccess={mockOnSuccess} onForgotPassword={mockOnForgotPassword} />
      );

      const submitButton = getByText('Sign In');
      const emailInput = getByPlaceholderText('Enter your email');

      // Form should be disabled initially
      expect(submitButton).toBeDisabled();

      // Add valid email but no password
      fireEvent.changeText(emailInput, 'test@example.com');

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it('enables submit button when form is valid', async () => {
      const { getByText, getByPlaceholderText } = render(
        <LoginForm onSuccess={mockOnSuccess} onForgotPassword={mockOnForgotPassword} />
      );

      const submitButton = getByText('Sign In');
      const emailInput = getByPlaceholderText('Enter your email');
      const passwordInput = getByPlaceholderText('Enter your password');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('Password visibility toggle', () => {
    it('toggles password visibility when show/hide button is pressed', () => {
      const { getByText, getByPlaceholderText } = render(
        <LoginForm onSuccess={mockOnSuccess} onForgotPassword={mockOnForgotPassword} />
      );

      const showButton = getByText('Show');
      const passwordInput = getByPlaceholderText('Enter your password');

      // Initially password should be hidden (secureTextEntry = true)
      expect(passwordInput.props.secureTextEntry).toBe(true);

      // Press show button
      fireEvent.press(showButton);

      // Now password should be visible (secureTextEntry = false)
      expect(passwordInput.props.secureTextEntry).toBe(false);
      expect(getByText('Hide')).toBeTruthy();

      // Press hide button
      fireEvent.press(getByText('Hide'));

      // Password should be hidden again
      expect(passwordInput.props.secureTextEntry).toBe(true);
      expect(getByText('Show')).toBeTruthy();
    });

    it('disables password toggle when loading', () => {
      mockUseAuth.isLoading = true;

      const { getByText } = render(
        <LoginForm onSuccess={mockOnSuccess} onForgotPassword={mockOnForgotPassword} />
      );

      const showButton = getByText('Show');
      expect(showButton).toBeDisabled();
    });
  });

  describe('Form submission', () => {
    it('calls login with correct credentials on valid form submission', async () => {
      mockLogin.mockResolvedValueOnce({});

      const { getByText, getByPlaceholderText } = render(
        <LoginForm onSuccess={mockOnSuccess} onForgotPassword={mockOnForgotPassword} />
      );

      const emailInput = getByPlaceholderText('Enter your email');
      const passwordInput = getByPlaceholderText('Enter your password');
      const submitButton = getByText('Sign In');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('calls onSuccess callback after successful login', async () => {
      mockLogin.mockResolvedValueOnce({});

      const { getByText, getByPlaceholderText } = render(
        <LoginForm onSuccess={mockOnSuccess} onForgotPassword={mockOnForgotPassword} />
      );

      const emailInput = getByPlaceholderText('Enter your email');
      const passwordInput = getByPlaceholderText('Enter your password');
      const submitButton = getByText('Sign In');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('shows alert on login failure', async () => {
      const error = new Error('Invalid credentials');
      mockLogin.mockRejectedValueOnce(error);

      const { getByText, getByPlaceholderText } = render(
        <LoginForm onSuccess={mockOnSuccess} onForgotPassword={mockOnForgotPassword} />
      );

      const emailInput = getByPlaceholderText('Enter your email');
      const passwordInput = getByPlaceholderText('Enter your password');
      const submitButton = getByText('Sign In');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Login Failed', 'Invalid credentials');
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('shows generic error message when error has no message', async () => {
      const error = new Error();
      mockLogin.mockRejectedValueOnce(error);

      const { getByText, getByPlaceholderText } = render(
        <LoginForm onSuccess={mockOnSuccess} onForgotPassword={mockOnForgotPassword} />
      );

      const emailInput = getByPlaceholderText('Enter your email');
      const passwordInput = getByPlaceholderText('Enter your password');
      const submitButton = getByText('Sign In');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Login Failed', 'Please try again.');
      });
    });
  });

  describe('Navigation callbacks', () => {
    it('calls onForgotPassword when forgot password link is pressed', () => {
      const { getByText } = render(
        <LoginForm onSuccess={mockOnSuccess} onForgotPassword={mockOnForgotPassword} />
      );

      const forgotPasswordButton = getByText('Forgot Password?');
      fireEvent.press(forgotPasswordButton);

      expect(mockOnForgotPassword).toHaveBeenCalled();
    });

    it('disables forgot password button when loading', () => {
      mockUseAuth.isLoading = true;

      const { getByText } = render(
        <LoginForm onSuccess={mockOnSuccess} onForgotPassword={mockOnForgotPassword} />
      );

      const forgotPasswordButton = getByText('Forgot Password?');
      expect(forgotPasswordButton).toBeDisabled();
    });
  });

  describe('Loading state', () => {
    it('disables all inputs and buttons when loading', () => {
      mockUseAuth.isLoading = true;

      const { getByText, getByPlaceholderText } = render(
        <LoginForm onSuccess={mockOnSuccess} onForgotPassword={mockOnForgotPassword} />
      );

      const emailInput = getByPlaceholderText('Enter your email');
      const passwordInput = getByPlaceholderText('Enter your password');
      const submitButton = getByText('Signing In...');
      const showButton = getByText('Show');
      const forgotPasswordButton = getByText('Forgot Password?');

      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
      expect(showButton).toBeDisabled();
      expect(forgotPasswordButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('sets correct keyboard type for email input', () => {
      const { getByPlaceholderText } = render(
        <LoginForm onSuccess={mockOnSuccess} onForgotPassword={mockOnForgotPassword} />
      );

      const emailInput = getByPlaceholderText('Enter your email');
      expect(emailInput.props.keyboardType).toBe('email-address');
    });

    it('sets correct autocapitalize and autocorrect props', () => {
      const { getByPlaceholderText } = render(
        <LoginForm onSuccess={mockOnSuccess} onForgotPassword={mockOnForgotPassword} />
      );

      const emailInput = getByPlaceholderText('Enter your email');
      const passwordInput = getByPlaceholderText('Enter your password');

      expect(emailInput.props.autoCapitalize).toBe('none');
      expect(emailInput.props.autoCorrect).toBe(false);
      expect(passwordInput.props.autoCapitalize).toBe('none');
      expect(passwordInput.props.autoCorrect).toBe(false);
    });
  });
});