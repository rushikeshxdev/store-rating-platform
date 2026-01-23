import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from '../hooks/useForm';
import { userService } from '../services/userService';
import { getDefaultRedirectPath } from '../utils/helpers';

const PasswordUpdatePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { values, errors, handleChange, setFormErrors } = useForm({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const validateForm = () => {
    const newErrors = {};

    // Current password is optional for verification
    // No validation needed for currentPassword

    // New password validation (8-16 chars, uppercase, special char)
    if (!values.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (values.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters long';
    } else if (values.newPassword.length > 16) {
      newErrors.newPassword = 'Password must not exceed 16 characters';
    } else if (!/[A-Z]/.test(values.newPassword)) {
      newErrors.newPassword = 'Password must contain at least one uppercase letter';
    } else if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(values.newPassword)) {
      newErrors.newPassword = 'Password must contain at least one special character';
    }

    // Confirm password validation
    if (!values.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (values.confirmPassword !== values.newPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const passwordData = {
        newPassword: values.newPassword,
      };

      // Include current password if provided
      if (values.currentPassword) {
        passwordData.currentPassword = values.currentPassword;
      }

      await userService.updatePassword(user.id, passwordData);

      setSuccessMessage('Password updated successfully! Redirecting...');
      setTimeout(() => {
        navigate(getDefaultRedirectPath(user.role));
      }, 2000);
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to update password. Please try again.';
      setGeneralError(errorMessage);
      setIsSubmitting(false);
    }
  };

  // Real-time validation feedback for new password
  const getPasswordValidationMessage = () => {
    if (!values.newPassword) return null;

    const issues = [];
    if (values.newPassword.length < 8) {
      issues.push('at least 8 characters');
    }
    if (values.newPassword.length > 16) {
      issues.push('max 16 characters');
    }
    if (!/[A-Z]/.test(values.newPassword)) {
      issues.push('one uppercase letter');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(values.newPassword)) {
      issues.push('one special character');
    }
    return issues.length > 0 ? `Need: ${issues.join(', ')}` : null;
  };

  const handleCancel = () => {
    navigate(getDefaultRedirectPath(user.role));
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Update Password</h1>

        {generalError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {generalError}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Current Password Field (Optional) */}
          <div className="mb-4">
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Current Password <span className="text-gray-500 text-xs">(optional)</span>
            </label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={values.currentPassword}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your current password"
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-gray-500">
              Optional: Provide for additional verification
            </p>
          </div>

          {/* New Password Field */}
          <div className="mb-4">
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
              New Password <span className="text-gray-500 text-xs">(8-16 chars, uppercase, special char)</span>
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={values.newPassword}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.newPassword
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="Enter your new password"
              disabled={isSubmitting}
            />
            {errors.newPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.newPassword}</p>
            )}
            {!errors.newPassword && getPasswordValidationMessage() && (
              <p className="mt-1 text-sm text-gray-500">{getPasswordValidationMessage()}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={values.confirmPassword}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.confirmPassword
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="Confirm your new password"
              disabled={isSubmitting}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 py-2 px-4 rounded-md text-white font-medium ${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
              }`}
            >
              {isSubmitting ? 'Updating...' : 'Update Password'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-1 py-2 px-4 rounded-md text-gray-700 font-medium bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordUpdatePage;
