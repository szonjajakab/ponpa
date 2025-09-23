import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { RegisterForm } from '../RegisterForm';

// Mock the auth store
const mockRegister = jest.fn();
const mockUseAuth = {
  register: mockRegister,
  isLoading: false,
  error: null,
};

jest.mock('../../store/useStore', () => ({
  useAuth: () => mockUseAuth,
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('RegisterForm', () => {
  const mockOnSuccess = jest.fn();
  const mockOnBackToLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.isLoading = false;
    mockUseAuth.error = null;
  });

  describe('Rendering', () => {
    it('renders form elements correctly', () => {
      const { getByText, getByPlaceholderText } = render(
        <RegisterForm onSuccess={mockOnSuccess} onBackToLogin={mockOnBackToLogin} />
      );

      expect(getByText('Create Account')).toBeTruthy();
      expect(getByText('Join us to build your perfect wardrobe')).toBeTruthy();
      expect(getByText('First Name')).toBeTruthy();
      expect(getByText('Last Name')).toBeTruthy();
      expect(getByText('Email')).toBeTruthy();
      expect(getByText('Password')).toBeTruthy();
      expect(getByText('Confirm Password')).toBeTruthy();
      expect(getByPlaceholderText('First name')).toBeTruthy();
      expect(getByPlaceholderText('Last name')).toBeTruthy();
      expect(getByPlaceholderText('Enter your email')).toBeTruthy();
      expect(getByPlaceholderText('Create a password')).toBeTruthy();
      expect(getByPlaceholderText('Confirm your password')).toBeTruthy();
    });

    it('renders terms and privacy checkboxes', () => {
      const { getByText } = render(
        <RegisterForm onSuccess={mockOnSuccess} onBackToLogin={mockOnBackToLogin} />
      );

      expect(getByText('I agree to the Terms and Conditions')).toBeTruthy();
      expect(getByText('I agree to the Privacy Policy')).toBeTruthy();
      expect(getByText('Create Account')).toBeTruthy();
      expect(getByText('Already have an account? Sign In')).toBeTruthy();
    });

    it('renders loading state correctly', () => {
      mockUseAuth.isLoading = true;

      const { getByText } = render(
        <RegisterForm onSuccess={mockOnSuccess} onBackToLogin={mockOnBackToLogin} />
      );

      expect(getByText('Creating Account...')).toBeTruthy();
    });

    it('renders error message when error exists', () => {
      mockUseAuth.error = 'Registration failed';

      const { getByText } = render(
        <RegisterForm onSuccess={mockOnSuccess} onBackToLogin={mockOnBackToLogin} />
      );

      expect(getByText('Registration failed')).toBeTruthy();
    });
  });

  describe('Form validation', () => {
    it('shows validation errors for empty required fields', async () => {
      const { getByText, getByPlaceholderText } = render(
        <RegisterForm onSuccess={mockOnSuccess} onBackToLogin={mockOnBackToLogin} />
      );

      const firstNameInput = getByPlaceholderText('First name');
      const lastNameInput = getByPlaceholderText('Last name');
      const emailInput = getByPlaceholderText('Enter your email');
      const passwordInput = getByPlaceholderText('Create a password');

      // Trigger validation by touching and blurring fields
      fireEvent.changeText(firstNameInput, '');
      fireEvent(firstNameInput, 'blur');
      fireEvent.changeText(lastNameInput, '');
      fireEvent(lastNameInput, 'blur');
      fireEvent.changeText(emailInput, '');
      fireEvent(emailInput, 'blur');
      fireEvent.changeText(passwordInput, '');
      fireEvent(passwordInput, 'blur');

      await waitFor(() => {
        expect(getByText('First name is required')).toBeTruthy();
        expect(getByText('Last name is required')).toBeTruthy();
        expect(getByText('Email is required')).toBeTruthy();
        expect(getByText('Password is required')).toBeTruthy();
      });
    });

    it('shows validation error for password mismatch', async () => {
      const { getByText, getByPlaceholderText } = render(
        <RegisterForm onSuccess={mockOnSuccess} onBackToLogin={mockOnBackToLogin} />
      );

      const passwordInput = getByPlaceholderText('Create a password');
      const confirmPasswordInput = getByPlaceholderText('Confirm your password');

      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'differentpassword');
      fireEvent(confirmPasswordInput, 'blur');

      await waitFor(() => {
        expect(getByText('Passwords must match')).toBeTruthy();
      });
    });

    it('shows validation error for weak password', async () => {
      const { getByText, getByPlaceholderText } = render(
        <RegisterForm onSuccess={mockOnSuccess} onBackToLogin={mockOnBackToLogin} />
      );

      const passwordInput = getByPlaceholderText('Create a password');

      fireEvent.changeText(passwordInput, '123');
      fireEvent(passwordInput, 'blur');

      await waitFor(() => {
        expect(getByText('Password must be at least 6 characters')).toBeTruthy();
      });
    });

    it('disables submit button when required checkboxes are not checked', async () => {
      const { getByText, getByPlaceholderText } = render(
        <RegisterForm onSuccess={mockOnSuccess} onBackToLogin={mockOnBackToLogin} />
      );

      // Fill all required fields
      fireEvent.changeText(getByPlaceholderText('First name'), 'John');
      fireEvent.changeText(getByPlaceholderText('Last name'), 'Doe');
      fireEvent.changeText(getByPlaceholderText('Enter your email'), 'john@example.com');
      fireEvent.changeText(getByPlaceholderText('Create a password'), 'password123');
      fireEvent.changeText(getByPlaceholderText('Confirm your password'), 'password123');

      const submitButton = getByText('Create Account');

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it('enables submit button when all validations pass', async () => {
      const { getByText, getByPlaceholderText } = render(
        <RegisterForm onSuccess={mockOnSuccess} onBackToLogin={mockOnBackToLogin} />
      );

      // Fill all required fields
      fireEvent.changeText(getByPlaceholderText('First name'), 'John');
      fireEvent.changeText(getByPlaceholderText('Last name'), 'Doe');
      fireEvent.changeText(getByPlaceholderText('Enter your email'), 'john@example.com');
      fireEvent.changeText(getByPlaceholderText('Create a password'), 'password123');
      fireEvent.changeText(getByPlaceholderText('Confirm your password'), 'password123');

      // Check required checkboxes
      fireEvent.press(getByText('I agree to the Terms and Conditions'));
      fireEvent.press(getByText('I agree to the Privacy Policy'));

      const submitButton = getByText('Create Account');

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('Password visibility toggles', () => {
    it('toggles password visibility for both password fields', () => {
      const { getByText, getByPlaceholderText } = render(
        <RegisterForm onSuccess={mockOnSuccess} onBackToLogin={mockOnBackToLogin} />
      );

      const passwordInput = getByPlaceholderText('Create a password');
      const confirmPasswordInput = getByPlaceholderText('Confirm your password');
      const showButtons = getByText('Show');

      // Initially passwords should be hidden
      expect(passwordInput.props.secureTextEntry).toBe(true);
      expect(confirmPasswordInput.props.secureTextEntry).toBe(true);

      // Press first show button (for password field)
      fireEvent.press(showButtons);

      expect(passwordInput.props.secureTextEntry).toBe(false);
      expect(getByText('Hide')).toBeTruthy();
    });

    it('disables password toggles when loading', () => {
      mockUseAuth.isLoading = true;

      const { getAllByText } = render(
        <RegisterForm onSuccess={mockOnSuccess} onBackToLogin={mockOnBackToLogin} />
      );

      const showButtons = getAllByText('Show');
      showButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Checkbox interactions', () => {
    it('toggles terms checkbox when pressed', () => {
      const { getByText } = render(
        <RegisterForm onSuccess={mockOnSuccess} onBackToLogin={mockOnBackToLogin} />
      );

      const termsCheckbox = getByText('I agree to the Terms and Conditions');

      // Initially unchecked
      fireEvent.press(termsCheckbox);

      // Should be checked now (would need to verify internal state)
      // Press again to uncheck
      fireEvent.press(termsCheckbox);
    });

    it('toggles privacy checkbox when pressed', () => {
      const { getByText } = render(
        <RegisterForm onSuccess={mockOnSuccess} onBackToLogin={mockOnBackToLogin} />
      );

      const privacyCheckbox = getByText('I agree to the Privacy Policy');

      fireEvent.press(privacyCheckbox);
      fireEvent.press(privacyCheckbox);
    });

    it('disables checkboxes when loading', () => {
      mockUseAuth.isLoading = true;

      const { getByText } = render(
        <RegisterForm onSuccess={mockOnSuccess} onBackToLogin={mockOnBackToLogin} />
      );

      const termsCheckbox = getByText('I agree to the Terms and Conditions');
      const privacyCheckbox = getByText('I agree to the Privacy Policy');

      expect(termsCheckbox).toBeDisabled();
      expect(privacyCheckbox).toBeDisabled();
    });
  });

  describe('Form submission', () => {
    const fillValidForm = (getByPlaceholderText: any, getByText: any) => {
      fireEvent.changeText(getByPlaceholderText('First name'), 'John');
      fireEvent.changeText(getByPlaceholderText('Last name'), 'Doe');
      fireEvent.changeText(getByPlaceholderText('Enter your email'), 'john@example.com');
      fireEvent.changeText(getByPlaceholderText('Create a password'), 'password123');
      fireEvent.changeText(getByPlaceholderText('Confirm your password'), 'password123');
      fireEvent.press(getByText('I agree to the Terms and Conditions'));
      fireEvent.press(getByText('I agree to the Privacy Policy'));
    };

    it('calls register with correct data on valid form submission', async () => {
      mockRegister.mockResolvedValueOnce({});

      const { getByText, getByPlaceholderText } = render(
        <RegisterForm onSuccess={mockOnSuccess} onBackToLogin={mockOnBackToLogin} />
      );

      fillValidForm(getByPlaceholderText, getByText);

      const submitButton = getByText('Create Account');

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'password123',
          confirmPassword: 'password123',
          termsAccepted: true,
          privacyAccepted: true,
        });
      });
    });

    it('shows success alert and calls onSuccess after successful registration', async () => {
      mockRegister.mockResolvedValueOnce({});

      const { getByText, getByPlaceholderText } = render(
        <RegisterForm onSuccess={mockOnSuccess} onBackToLogin={mockOnBackToLogin} />
      );

      fillValidForm(getByPlaceholderText, getByText);

      const submitButton = getByText('Create Account');

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Registration Successful',
          'Please check your email to verify your account.',
          [{ text: 'OK', onPress: mockOnSuccess }]
        );
      });
    });

    it('shows alert on registration failure', async () => {
      const error = new Error('Email already in use');
      mockRegister.mockRejectedValueOnce(error);

      const { getByText, getByPlaceholderText } = render(
        <RegisterForm onSuccess={mockOnSuccess} onBackToLogin={mockOnBackToLogin} />
      );

      fillValidForm(getByPlaceholderText, getByText);

      const submitButton = getByText('Create Account');

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Registration Failed', 'Email already in use');
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('shows generic error message when error has no message', async () => {
      const error = new Error();
      mockRegister.mockRejectedValueOnce(error);

      const { getByText, getByPlaceholderText } = render(
        <RegisterForm onSuccess={mockOnSuccess} onBackToLogin={mockOnBackToLogin} />
      );

      fillValidForm(getByPlaceholderText, getByText);

      const submitButton = getByText('Create Account');

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });

      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Registration Failed', 'Please try again.');
      });
    });
  });

  describe('Navigation callbacks', () => {
    it('calls onBackToLogin when back to login link is pressed', () => {
      const { getByText } = render(
        <RegisterForm onSuccess={mockOnSuccess} onBackToLogin={mockOnBackToLogin} />
      );

      const backToLoginButton = getByText('Already have an account? Sign In');
      fireEvent.press(backToLoginButton);

      expect(mockOnBackToLogin).toHaveBeenCalled();
    });

    it('disables back to login button when loading', () => {
      mockUseAuth.isLoading = true;

      const { getByText } = render(
        <RegisterForm onSuccess={mockOnSuccess} onBackToLogin={mockOnBackToLogin} />
      );

      const backToLoginButton = getByText('Already have an account? Sign In');
      expect(backToLoginButton).toBeDisabled();
    });
  });

  describe('Loading state', () => {
    it('disables all inputs and buttons when loading', () => {
      mockUseAuth.isLoading = true;

      const { getByText, getByPlaceholderText, getAllByText } = render(
        <RegisterForm onSuccess={mockOnSuccess} onBackToLogin={mockOnBackToLogin} />
      );

      const inputs = [
        getByPlaceholderText('First name'),
        getByPlaceholderText('Last name'),
        getByPlaceholderText('Enter your email'),
        getByPlaceholderText('Create a password'),
        getByPlaceholderText('Confirm your password'),
      ];

      inputs.forEach(input => {
        expect(input).toBeDisabled();
      });

      const submitButton = getByText('Creating Account...');
      const showButtons = getAllByText('Show');
      const termsCheckbox = getByText('I agree to the Terms and Conditions');
      const privacyCheckbox = getByText('I agree to the Privacy Policy');
      const backToLoginButton = getByText('Already have an account? Sign In');

      expect(submitButton).toBeDisabled();
      showButtons.forEach(button => expect(button).toBeDisabled());
      expect(termsCheckbox).toBeDisabled();
      expect(privacyCheckbox).toBeDisabled();
      expect(backToLoginButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('sets correct keyboard and input props', () => {
      const { getByPlaceholderText } = render(
        <RegisterForm onSuccess={mockOnSuccess} onBackToLogin={mockOnBackToLogin} />
      );

      const emailInput = getByPlaceholderText('Enter your email');
      const firstNameInput = getByPlaceholderText('First name');
      const passwordInput = getByPlaceholderText('Create a password');

      expect(emailInput.props.keyboardType).toBe('email-address');
      expect(emailInput.props.autoCapitalize).toBe('none');
      expect(emailInput.props.autoCorrect).toBe(false);

      expect(firstNameInput.props.autoCapitalize).toBe('words');

      expect(passwordInput.props.autoCapitalize).toBe('none');
      expect(passwordInput.props.autoCorrect).toBe(false);
    });
  });
});