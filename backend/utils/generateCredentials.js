import crypto from 'crypto';

/**
 * Generates deterministic username/userID and a readable secure initial password from ERP ID
 * @param {string} erpId 
 * @returns {object} { username, password }
 */
export const generateStudentCredentials = (erpId) => {
  const username = `tcet.std.${erpId}`;
  
  // Create a semi-random but readable secure password
  // We use the last 4 digits of erpId and a small random string
  const suffix = erpId.slice(-4);
  const randomChars = crypto.randomBytes(3).toString('hex').slice(0, 4).toUpperCase();
  const password = `Tcet@${suffix}${randomChars}`;
  
  return { username, password };
};

/**
 * Generates deterministic faculty password
 * @param {string} email 
 * @returns {string} password
 */
export const generateFacultyPassword = (email) => {
  const prefix = email.split('@')[0];
  return `Faculty@${prefix.slice(0, 4).toUpperCase()}#2026`;
};
