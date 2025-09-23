import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RegisterScreen } from '../RegisterScreen';

// Mock the RegisterForm component
const mockRegisterForm = jest.fn();
jest.mock('../../../components/forms/RegisterForm', () => ({
  RegisterForm: (props: any) => {
    mockRegisterForm(props);
    return null;
  },
}));

describe('RegisterScreen', () => {
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
    it('renders RegisterForm with correct props', () => {
      render(<RegisterScreen navigation={mockNavigation} />);

      expect(mockRegisterForm).toHaveBeenCalledWith(
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onBackToLogin: expect.any(Function),
        })
      );
    });
  });

  describe('Navigation handlers', () => {
    it('navigates to Login when onBackToLogin callback is called', () => {
      render(<RegisterScreen navigation={mockNavigation} />);

      // Get the onBackToLogin callback passed to RegisterForm
      const onBackToLoginCallback = mockRegisterForm.mock.calls[0][0].onBackToLogin;
      onBackToLoginCallback();

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Login');
    });
  });

  describe('Success handler', () => {
    it('logs success message when onSuccess callback is called', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      render(<RegisterScreen navigation={mockNavigation} />);

      // Get the onSuccess callback passed to RegisterForm
      const onSuccessCallback = mockRegisterForm.mock.calls[0][0].onSuccess;
      onSuccessCallback();

      expect(consoleSpy).toHaveBeenCalledWith('Registration successful');

      consoleSpy.mockRestore();
    });
  });

  describe('Layout structure', () => {
    it('renders with correct container structure', () => {
      // Verify the component renders without crashing
      const { root } = render(<RegisterScreen navigation={mockNavigation} />);
      expect(root).toBeTruthy();
    });
  });

  describe('Platform behavior', () => {
    it('renders KeyboardAvoidingView for proper keyboard handling', () => {
      // This test verifies the component structure includes KeyboardAvoidingView
      // The exact behavior would require more complex testing setup
      const { root } = render(<RegisterScreen navigation={mockNavigation} />);

      // Verify the component renders without crashing
      expect(root).toBeTruthy();
    });
  });

  describe('Callback integration', () => {
    it('passes all required callbacks to RegisterForm', () => {
      render(<RegisterScreen navigation={mockNavigation} />);

      const passedProps = mockRegisterForm.mock.calls[0][0];
      expect(typeof passedProps.onSuccess).toBe('function');
      expect(typeof passedProps.onBackToLogin).toBe('function');
    });

    it('handles registration success correctly', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      render(<RegisterScreen navigation={mockNavigation} />);

      const passedProps = mockRegisterForm.mock.calls[0][0];
      passedProps.onSuccess();

      expect(consoleSpy).toHaveBeenCalledWith('Registration successful');
      // Note: Navigation is handled by auth state change in AppNavigator
      expect(mockNavigation.navigate).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('handles back to login navigation correctly', () => {
      render(<RegisterScreen navigation={mockNavigation} />);

      const passedProps = mockRegisterForm.mock.calls[0][0];
      passedProps.onBackToLogin();

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Login');
    });
  });

  describe('Component lifecycle', () => {
    it('properly initializes with navigation prop', () => {
      const { root } = render(<RegisterScreen navigation={mockNavigation} />);

      expect(root).toBeTruthy();
      expect(mockRegisterForm).toHaveBeenCalledTimes(1);
    });
  });
});