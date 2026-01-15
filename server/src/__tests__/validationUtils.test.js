/**
 * Property-Based Tests for Validation Utilities
 * Feature: store-rating-platform, Property 5: Input validation enforces field constraints
 * Validates: Requirements 2.2, 2.3, 2.4, 2.5, 10.1, 10.2, 10.3, 10.4, 10.5, 10.7
 */

const fc = require('fast-check');
const {
  validateName,
  validateEmail,
  validatePassword,
  validateAddress,
  validateRating
} = require('../utils/validationUtils');

describe('Property 5: Input validation enforces field constraints', () => {
  
  describe('validateName', () => {
    it('should accept names with 20-60 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 20, maxLength: 60 }).filter(s => s.trim().length >= 20 && s.trim().length <= 60),
          (name) => {
            const result = validateName(name);
            return result.valid === true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject names with less than 20 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 19 }),
          (name) => {
            const result = validateName(name);
            return result.valid === false && result.error !== undefined;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject names with more than 60 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 61, maxLength: 100 }).filter(s => s.trim().length > 60),
          (name) => {
            const result = validateName(name);
            return result.valid === false && result.error !== undefined;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject non-string inputs', () => {
      fc.assert(
        fc.property(
          fc.oneof(fc.integer(), fc.boolean(), fc.constant(null), fc.constant(undefined)),
          (input) => {
            const result = validateName(input);
            return result.valid === false && result.error !== undefined;
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('validateEmail', () => {
    it('should accept valid email formats', () => {
      fc.assert(
        fc.property(
          fc.emailAddress(),
          (email) => {
            const result = validateEmail(email);
            return result.valid === true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject strings without @ symbol', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => !s.includes('@')),
          (invalidEmail) => {
            const result = validateEmail(invalidEmail);
            return result.valid === false && result.error !== undefined;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject non-string inputs', () => {
      fc.assert(
        fc.property(
          fc.oneof(fc.integer(), fc.boolean(), fc.constant(null), fc.constant(undefined)),
          (input) => {
            const result = validateEmail(input);
            return result.valid === false && result.error !== undefined;
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('validatePassword', () => {
    // Generator for valid passwords: 8-16 chars with at least one uppercase and one special char
    const validPasswordArbitrary = fc.string({ minLength: 6, maxLength: 14 })
      .map(base => {
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const special = '!@#$%^&*()_+-=[]{};\':"|,.<>/?';
        const upperChar = uppercase[Math.floor(Math.random() * uppercase.length)];
        const specialChar = special[Math.floor(Math.random() * special.length)];
        return base + upperChar + specialChar;
      });

    it('should accept passwords with 8-16 chars, uppercase, and special character', () => {
      fc.assert(
        fc.property(
          validPasswordArbitrary,
          (password) => {
            const result = validatePassword(password);
            return result.valid === true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject passwords shorter than 8 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 7 }),
          (password) => {
            const result = validatePassword(password);
            return result.valid === false && result.error !== undefined;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject passwords longer than 16 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 17, maxLength: 30 }),
          (password) => {
            const result = validatePassword(password);
            return result.valid === false && result.error !== undefined;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject passwords without uppercase letters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 8, maxLength: 16 })
            .filter(s => !/[A-Z]/.test(s) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(s)),
          (password) => {
            const result = validatePassword(password);
            return result.valid === false && result.error !== undefined;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject passwords without special characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 8, maxLength: 16 })
            .filter(s => /[A-Z]/.test(s) && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(s)),
          (password) => {
            const result = validatePassword(password);
            return result.valid === false && result.error !== undefined;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject non-string inputs', () => {
      fc.assert(
        fc.property(
          fc.oneof(fc.integer(), fc.boolean(), fc.constant(null), fc.constant(undefined)),
          (input) => {
            const result = validatePassword(input);
            return result.valid === false && result.error !== undefined;
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('validateAddress', () => {
    it('should accept addresses with 1-400 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 400 }).filter(s => s.trim().length > 0 && s.trim().length <= 400),
          (address) => {
            const result = validateAddress(address);
            return result.valid === true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject addresses longer than 400 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 401, maxLength: 500 }),
          (address) => {
            const result = validateAddress(address);
            return result.valid === false && result.error !== undefined;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject empty or whitespace-only addresses', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(''),
            fc.constant('   '),
            fc.constant('\t\t'),
            fc.constant('\n\n')
          ),
          (address) => {
            const result = validateAddress(address);
            return result.valid === false && result.error !== undefined;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject non-string inputs', () => {
      fc.assert(
        fc.property(
          fc.oneof(fc.integer(), fc.boolean(), fc.constant(null), fc.constant(undefined)),
          (input) => {
            const result = validateAddress(input);
            return result.valid === false && result.error !== undefined;
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('validateRating', () => {
    it('should accept integer ratings between 1 and 5', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }),
          (rating) => {
            const result = validateRating(rating);
            return result.valid === true;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject ratings less than 1', () => {
      fc.assert(
        fc.property(
          fc.integer({ max: 0 }),
          (rating) => {
            const result = validateRating(rating);
            return result.valid === false && result.error !== undefined;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject ratings greater than 5', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 6 }),
          (rating) => {
            const result = validateRating(rating);
            return result.valid === false && result.error !== undefined;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject non-integer numbers', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 1.1, max: 4.9, noNaN: true }),
          (rating) => {
            const result = validateRating(rating);
            return result.valid === false && result.error !== undefined;
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should reject non-number inputs', () => {
      fc.assert(
        fc.property(
          fc.oneof(fc.string(), fc.boolean(), fc.constant(null), fc.constant(undefined)),
          (input) => {
            const result = validateRating(input);
            return result.valid === false && result.error !== undefined;
          }
        ),
        { numRuns: 10 }
      );
    });
  });
});
