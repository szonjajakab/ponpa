import * as yup from 'yup';

// Common validation patterns
const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const PHONE_REGEX = /^[\+]?[1-9][\d]{0,3}[\s\-\(\)]?[\(]?[\d]{1,3}[\)]?[\s\-]?[\d]{1,4}[\s\-]?[\d]{1,4}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

// Base field validators
export const validators = {
  email: yup
    .string()
    .required('Email is required')
    .matches(EMAIL_REGEX, 'Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters'),

  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .matches(
      PASSWORD_REGEX,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),

  confirmPassword: (passwordField: string = 'password') =>
    yup
      .string()
      .required('Please confirm your password')
      .oneOf([yup.ref(passwordField)], 'Passwords do not match'),

  firstName: yup
    .string()
    .required('First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must be less than 50 characters')
    .matches(/^[a-zA-Z\s]+$/, 'First name can only contain letters and spaces'),

  lastName: yup
    .string()
    .required('Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must be less than 50 characters')
    .matches(/^[a-zA-Z\s]+$/, 'Last name can only contain letters and spaces'),

  displayName: yup
    .string()
    .required('Display name is required')
    .min(2, 'Display name must be at least 2 characters')
    .max(30, 'Display name must be less than 30 characters')
    .matches(/^[a-zA-Z0-9_\s]+$/, 'Display name can only contain letters, numbers, spaces, and underscores'),

  phone: yup
    .string()
    .optional()
    .matches(PHONE_REGEX, 'Please enter a valid phone number'),

  dateOfBirth: yup
    .date()
    .optional()
    .max(new Date(), 'Date of birth cannot be in the future')
    .test('age', 'You must be at least 13 years old', function (value) {
      if (!value) return true; // Allow empty date
      const today = new Date();
      const birthDate = new Date(value);
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        return age - 1 >= 13;
      }
      return age >= 13;
    }),

  bio: yup
    .string()
    .optional()
    .max(500, 'Bio must be less than 500 characters'),

  website: yup
    .string()
    .optional()
    .url('Please enter a valid URL'),

  termsAccepted: yup
    .boolean()
    .required('You must accept the terms and conditions')
    .oneOf([true], 'You must accept the terms and conditions'),

  privacyAccepted: yup
    .boolean()
    .required('You must accept the privacy policy')
    .oneOf([true], 'You must accept the privacy policy'),
};

// Form schemas
export const authSchemas = {
  login: yup.object({
    email: validators.email,
    password: yup.string().required('Password is required'),
  }),

  register: yup.object({
    firstName: validators.firstName,
    lastName: validators.lastName,
    email: validators.email,
    password: validators.password,
    confirmPassword: validators.confirmPassword(),
    termsAccepted: validators.termsAccepted,
    privacyAccepted: validators.privacyAccepted,
  }),

  forgotPassword: yup.object({
    email: validators.email,
  }),

  resetPassword: yup.object({
    password: validators.password,
    confirmPassword: validators.confirmPassword(),
  }),
};

export const profileSchemas = {
  updateProfile: yup.object({
    firstName: validators.firstName,
    lastName: validators.lastName,
    displayName: validators.displayName,
    email: validators.email,
    phone: validators.phone,
    dateOfBirth: validators.dateOfBirth,
    bio: validators.bio,
    website: validators.website,
  }),

  changePassword: yup.object({
    currentPassword: yup.string().required('Current password is required'),
    newPassword: validators.password,
    confirmNewPassword: validators.confirmPassword('newPassword'),
  }),
};

// Utility functions for validation
export const validateField = async (schema: yup.AnySchema, value: any): Promise<string | null> => {
  try {
    await schema.validate(value);
    return null;
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      return error.message;
    }
    return 'Validation error';
  }
};

export const validateForm = async <T extends Record<string, any>>(
  schema: yup.ObjectSchema<T>,
  data: T
): Promise<{ isValid: boolean; errors: Partial<Record<keyof T, string>> }> => {
  try {
    await schema.validate(data, { abortEarly: false });
    return { isValid: true, errors: {} };
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      const errors: Partial<Record<keyof T, string>> = {};
      error.inner.forEach((err) => {
        if (err.path) {
          errors[err.path as keyof T] = err.message;
        }
      });
      return { isValid: false, errors };
    }
    return { isValid: false, errors: {} };
  }
};

// Type definitions for form data
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
}

export interface ForgotPasswordFormData {
  email: string;
}

export interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

export interface ProfileFormData {
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone: string;
  dateOfBirth?: Date;
  bio: string;
  website: string;
}

export interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}