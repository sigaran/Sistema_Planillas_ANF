import SHA256 from 'crypto-js/sha256';

/**
 * Hashes a password using the SHA-256 algorithm.
 * @param password The plain text password.
 * @returns The SHA-256 hashed password as a string.
 */
export const hashPassword = (password: string): string => {
  return SHA256(password).toString();
};
