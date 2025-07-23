import bcrypt from "bcrypt";

/**
 * Compares a plaintext password with a hashed password.
 * @param password - The plaintext password to compare.
 * @param hash - The hashed password to compare against.
 * @returns A promise that resolves to true if the passwords match, false otherwise.
 * @example
 * ```ts
 * // CommonJS
 * const { comparePassword } = require("softlance");
 * // ES Module
 * import { comparePassword } from "softlance";
 *
 * // Compare a plaintext password with a hashed password
 * const isMatch = await comparePassword("mySecretPassword", "$2b$12$...");
 * // Output: true or false
 * ```
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}