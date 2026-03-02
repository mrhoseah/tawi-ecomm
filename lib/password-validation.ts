/**
 * Strong password validation to prevent weak passwords.
 * Enforces: min 8 chars, uppercase, lowercase, number, special char.
 */
const MIN_LENGTH = 8;
const MAX_LENGTH = 128;
const UPPERCASE_REGEX = /[A-Z]/;
const LOWERCASE_REGEX = /[a-z]/;
const NUMBER_REGEX = /\d/;
const SPECIAL_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/;
const VALID_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  if (typeof password !== "string") {
    return { valid: false, errors: ["Password is required"] };
  }
  const pwd = password.trim();
  if (pwd.length < MIN_LENGTH) {
    errors.push(`Password must be at least ${MIN_LENGTH} characters`);
  }
  if (pwd.length > MAX_LENGTH) {
    errors.push(`Password must be at most ${MAX_LENGTH} characters`);
  }
  if (!UPPERCASE_REGEX.test(pwd)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!LOWERCASE_REGEX.test(pwd)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!NUMBER_REGEX.test(pwd)) {
    errors.push("Password must contain at least one number");
  }
  if (!SPECIAL_REGEX.test(pwd)) {
    errors.push("Password must contain at least one special character (!@#$%^&*...)");
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateEmail(email: string): boolean {
  if (typeof email !== "string") return false;
  const trimmed = email.trim();
  if (trimmed.length > 254) return false;
  return VALID_EMAIL_REGEX.test(trimmed);
}
