import bcrypt from "bcrypt";

/**
 * Hashes a password using bcrypt with the specified number of salt rounds.
 * @param {string} password - The password to hash.
 * @param {number} saltRounds - The number of rounds to use for hashing. (default is 12)
 * @returns {Promise<string>} - A promise that resolves to the hashed password.
 * @example
 * ```ts
 * // CommonJS
 * const { hashPassword } = require("softlance");
 * // ES Module
 * import { hashPassword } from "softlance";
 * 
 * // Hash a password with default salt rounds
 * const hashedPassword = await hashPassword("mySecretPassword");
 * // Hash a password with custom salt rounds
 * const hashedPassword = await hashPassword("mySecretPassword", 10);
 * // Output: "$2b$10$..."
 * ```
 */
export async function hashPassword(password: string, saltRounds: number = 12): Promise<string> {
  return await bcrypt.hash(password, saltRounds);
}