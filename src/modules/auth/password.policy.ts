export class PasswordPolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PasswordPolicyError";
  }
}
export function validatePassword(password: string): void {
  
  if (password.length < 8) {
    throw new PasswordPolicyError(
      "Password must be at least 8 characters long"
    );
  }

  if (password.length > 72) {
    throw new PasswordPolicyError(
      "Password must be at most 72 characters long"
    );
  }

  if (!/[a-zA-Z]/.test(password)) {
    throw new PasswordPolicyError(
      "Password must contain at least one letter"
    );
  }

  if (!/[0-9]/.test(password)) {
    throw new PasswordPolicyError(
      "Password must contain at least one number"
    );
  }

  if (password.trim() !== password) {
    throw new PasswordPolicyError(
      "Password must not contain leading or trailing spaces"
    );
  }

}  
