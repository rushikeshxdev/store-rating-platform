/**
 * Validate name field (20-60 characters)
 * @param {string} name - Name to validate
 * @returns {Object} { valid: boolean, error?: string }
 */
function validateName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Name is required and must be a string' };
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length < 20) {
    return { valid: false, error: 'Name must be at least 20 characters long' };
  }
  
  if (trimmedName.length > 60) {
    return { valid: false, error: 'Name must not exceed 60 characters' };
  }
  
  return { valid: true };
}

/**
 * Validate email field (standard email format)
 * @param {string} email - Email to validate
 * @returns {Object} { valid: boolean, error?: string }
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required and must be a string' };
  }
  
  // Standard email regex pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Email must be in valid format' };
  }
  
  return { valid: true };
}

/**
 * Validate password field (8-16 chars, at least one uppercase letter and one special character)
 * @param {string} password - Password to validate
 * @returns {Object} { valid: boolean, error?: string }
 */
function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required and must be a string' };
  }
  
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }
  
  if (password.length > 16) {
    return { valid: false, error: 'Password must not exceed 16 characters' };
  }
  
  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }
  
  // Check for at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one special character' };
  }
  
  return { valid: true };
}

/**
 * Validate address field (max 400 characters)
 * @param {string} address - Address to validate
 * @returns {Object} { valid: boolean, error?: string }
 */
function validateAddress(address) {
  if (!address || typeof address !== 'string') {
    return { valid: false, error: 'Address is required and must be a string' };
  }
  
  const trimmedAddress = address.trim();
  
  if (trimmedAddress.length === 0) {
    return { valid: false, error: 'Address cannot be empty' };
  }
  
  if (trimmedAddress.length > 400) {
    return { valid: false, error: 'Address must not exceed 400 characters' };
  }
  
  return { valid: true };
}

/**
 * Validate rating value (1-5 integer)
 * @param {number} rating - Rating to validate
 * @returns {Object} { valid: boolean, error?: string }
 */
function validateRating(rating) {
  if (rating === null || rating === undefined) {
    return { valid: false, error: 'Rating is required' };
  }
  
  if (typeof rating !== 'number') {
    return { valid: false, error: 'Rating must be a number' };
  }
  
  if (!Number.isInteger(rating)) {
    return { valid: false, error: 'Rating must be an integer' };
  }
  
  if (rating < 1 || rating > 5) {
    return { valid: false, error: 'Rating must be between 1 and 5' };
  }
  
  return { valid: true };
}

module.exports = {
  validateName,
  validateEmail,
  validatePassword,
  validateAddress,
  validateRating
};
