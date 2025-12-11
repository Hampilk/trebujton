import { describe, it, expect } from 'vitest';
import { loginSchema, signupSchema } from '@/schemas/auth';

describe('Auth Schemas', () => {
  describe('loginSchema', () => {
    it('validates valid login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };
      
      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
      };
      
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid email address');
      }
    });

    it('rejects short password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: '12345',
      };
      
      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password must be at least 6 characters');
      }
    });

    it('accepts optional rememberMe field', () => {
      const dataWithRememberMe = {
        email: 'test@example.com',
        password: 'password123',
        rememberMe: true,
      };
      
      const result = loginSchema.safeParse(dataWithRememberMe);
      expect(result.success).toBe(true);
    });
  });

  describe('signupSchema', () => {
    it('validates valid signup data', () => {
      const validData = {
        fullName: 'John Doe',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };
      
      const result = signupSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('rejects short name', () => {
      const invalidData = {
        fullName: 'A',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };
      
      const result = signupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Name must be at least 2 characters');
      }
    });

    it('rejects invalid email', () => {
      const invalidData = {
        fullName: 'John Doe',
        email: 'invalid-email',
        password: 'password123',
        confirmPassword: 'password123',
      };
      
      const result = signupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid email address');
      }
    });

    it('rejects short password', () => {
      const invalidData = {
        fullName: 'John Doe',
        email: 'test@example.com',
        password: '12345',
        confirmPassword: '12345',
      };
      
      const result = signupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password must be at least 6 characters');
      }
    });

    it('rejects mismatched passwords', () => {
      const invalidData = {
        fullName: 'John Doe',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password456',
      };
      
      const result = signupSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmPasswordError = result.error.issues.find(
          issue => issue.path[0] === 'confirmPassword'
        );
        expect(confirmPasswordError?.message).toBe("Passwords don't match");
      }
    });
  });
});
