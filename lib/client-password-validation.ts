/**
 * Client-side password validation (mirrors lib/password-validation.ts).
 * Use in sign-up and change-password forms.
 */
const MIN_LENGTH = 8;
const MAX_LENGTH = 128;
const UPPERCASE_REGEX = /[A-Z]/;
const LOWERCASE_REGEX = /[a-z]/;
const NUMBER_REGEX = /\d/;
const SPECIAL_REGEX = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/;

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePasswordClient(password: string): PasswordValidationResult {
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
    errors.push("At least one uppercase letter");
  }
  if (!LOWERCASE_REGEX.test(pwd)) {
    errors.push("At least one lowercase letter");
  }
  if (!NUMBER_REGEX.test(pwd)) {
    errors.push("At least one number");
  }
  if (!SPECIAL_REGEX.test(pwd)) {
    errors.push("At least one special character (!@#$%^&*...)");
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}
