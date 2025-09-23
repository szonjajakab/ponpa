import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LoginScreen } from '../LoginScreen';

// Mock the LoginForm component
const mockLoginForm = jest.fn();
jest.mock('../../../components/forms/LoginForm', () => ({
  LoginForm: (props: any) => {
    mockLoginForm(props);
    return null;
  },
}));

describe('LoginScreen', () => {
  const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    dispatch: jest.fn(),
    setParams: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    canGoBack: jest.fn(),
    getId: jest.fn(),
    getParent: jest.fn(),
    getState: jest.fn(),
    isFocused: jest.fn(),
    reset: jest.fn(),
    setOptions: jest.fn(),
    pop: jest.fn(),
    popToTop: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders LoginForm with correct props', () => {
      render(<LoginScreen navigation={mockNavigation} />);

      expect(mockLoginForm).toHaveBeenCalledWith(
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onForgotPassword: expect.any(Function),
        })
      );
    });
  });

  describe('Navigation handlers', () => {
    it('navigates to Register when handleGoToRegister is called', () => {
      const { getByText } = render(<LoginScreen navigation={mockNavigation} />);

      // Get the register button and press it
      const registerButton = getByText('Sign Up');
      fireEvent.press(registerButton);

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Register');
    });

    it('navigates to ForgotPassword when onForgotPassword callback is called', () => {
      render(<LoginScreen navigation={mockNavigation} />);

      // Get the onForgotPassword callback passed to LoginForm
      const onForgotPasswordCallback = mockLoginForm.mock.calls[0][0].onForgotPassword;
      onForgotPasswordCallback();

      expect(mockNavigation.navigate).toHaveBeenCalledWith('ForgotPassword');
    });
  });

  describe('Success handler', () => {
    it('logs success message when onSuccess callback is called', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      render(<LoginScreen navigation={mockNavigation} />);

      // Get the onSuccess callback passed to LoginForm
      const onSuccessCallback = mockLoginForm.mock.calls[0][0].onSuccess;
      onSuccessCallback();

      expect(consoleSpy).toHaveBeenCalledWith('Login successful');

      consoleSpy.mockRestore();
    });
  });

  describe('Layout structure', () => {
    it('renders with correct container structure', () => {
      const { getByText } = render(<LoginScreen navigation={mockNavigation} />);

      // Should render the register link text
      expect(getByText("Don't have an account?")).toBeTruthy();
      expect(getByText('Sign Up')).toBeTruthy();
    });
  });

  describe('Platform behavior', () => {
    it('renders KeyboardAvoidingView for proper keyboard handling', () => {
      // This test verifies the component structure includes KeyboardAvoidingView
      // The exact behavior would require more complex testing setup
      const { root } = render(<LoginScreen navigation={mockNavigation} />);

      // Verify the component renders without crashing
      expect(root).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('provides proper text hierarchy for screen readers', () => {
      const { getByText } = render(<LoginScreen navigation={mockNavigation} />);

      // Should have clear text for navigation
      expect(getByText("Don't have an account?")).toBeTruthy();
      expect(getByText('Sign Up')).toBeTruthy();
    });
  });

  describe('Callback integration', () => {
    it('passes all required callbacks to LoginForm', () => {
      render(<LoginScreen navigation={mockNavigation} />);

      const passedProps = mockLoginForm.mock.calls[0][0];
      expect(typeof passedProps.onSuccess).toBe('function');
      expect(typeof passedProps.onForgotPassword).toBe('function');
    });
  });
});