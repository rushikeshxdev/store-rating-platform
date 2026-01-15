import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useForm } from '../hooks/useForm';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { values, errors, handleChange, setFormErrors } = useForm({
    name: '',
    email: '',
    address: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const validateForm = () => {
    const newErrors = {};

    // Name validation (20-60 characters)
    if (!values.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (values.name.trim().length < 20) {
      newErrors.name = 'Name must be at least 20 characters long';
    } else if (values.name.trim().length > 60) {
      newErrors.name = 'Name must not exceed 60 characters';
    }

    // Email validation
    if (!values.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      newErrors.email = 'Email must be in valid format';
    }

    // Address validation (max 400 characters)
    if (!values.address.trim()) {
      newErrors.address = 'Address is required';
    } else if (values.address.trim().length > 400) {
      newErrors.address = 'Address must not exceed 400 characters';
    }

    // Password validation (8-16 chars, uppercase, special char)
    if (!values.password) {
      newErrors.password = 'Password is required';
    } else if (values.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else if (values.password.length > 16) {
      newErrors.password = 'Password must not exceed 16 characters';
    } else if (!/[A-Z]/.test(values.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(values.password)) {
      newErrors.password = 'Password must contain at least one special character';
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
      const result = await register({
        name: values.name.trim(),
        email: values.email.trim(),
        address: values.address.trim(),
        password: values.password,
      });

      if (result.success) {
        setSuccessMessage('Registration successful! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setGeneralError(result.error || 'Registration failed. Please try again.');
        setIsSubmitting(false);
      }
    } catch (error) {
      setGeneralError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Real-time validation feedback
  const getFieldValidationMessage = (fieldName) => {
    if (!values[fieldName]) return null;

    switch (fieldName) {
      case 'name':
        const nameLength = values.name.trim().length;
        if (nameLength > 0 && nameLength < 20) {
          return `${20 - nameLength} more characters needed`;
        } else if (nameLength > 60) {
          return `${nameLength - 60} characters over limit`;
        }
        return null;

      case 'address':
        const addressLength = values.address.trim().length;
        if (addressLength > 400) {
          return `${addressLength - 400} characters over limit`;
        }
        return null;

      case 'password':
        const issues = [];
        if (values.password.length < 8) {
          issues.push('at least 8 characters');
        }
        if (values.password.length > 16) {
          issues.push('max 16 characters');
        }
        if (!/[A-Z]/.test(values.password)) {
          issues.push('one uppercase letter');
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(values.password)) {
          issues.push('one special character');
        }
        return issues.length > 0 ? `Need: ${issues.join(', ')}` : null;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Register</h1>

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
          {/* Name Field */}
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Name <span className="text-gray-500 text-xs">(20-60 characters)</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={values.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.name
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="Enter your full name"
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
            {!errors.name && getFieldValidationMessage('name') && (
              <p className="mt-1 text-sm text-gray-500">{getFieldValidationMessage('name')}</p>
            )}
          </div>

          {/* Email Field */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={values.email}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.email
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="Enter your email"
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Address Field */}
          <div className="mb-4">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              Address <span className="text-gray-500 text-xs">(max 400 characters)</span>
            </label>
            <textarea
              id="address"
              name="address"
              value={values.address}
              onChange={handleChange}
              rows="3"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.address
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="Enter your address"
              disabled={isSubmitting}
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-600">{errors.address}</p>
            )}
            {!errors.address && getFieldValidationMessage('address') && (
              <p className="mt-1 text-sm text-red-600">{getFieldValidationMessage('address')}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password <span className="text-gray-500 text-xs">(8-16 chars, uppercase, special char)</span>
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={values.password}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.password
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="Enter your password"
              disabled={isSubmitting}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
            {!errors.password && getFieldValidationMessage('password') && (
              <p className="mt-1 text-sm text-gray-500">{getFieldValidationMessage('password')}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-2 px-4 rounded-md text-white font-medium ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
            }`}
          >
            {isSubmitting ? 'Registering...' : 'Register'}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
