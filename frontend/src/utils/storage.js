/**
 * Tab-isolated authentication storage utility.
 * Uses sessionStorage so that testing multiple roles (Student, Faculty, Admin)
 * simultaneously across multiple tabs on the same computer maintains complete
 * session isolation and never overwrites other tabs' credentials.
 */

const AUTH_KEYS = [
  'token',
  'role',
  'name',
  'username',
  'email',
  'erpId',
  'userId',
  'branch',
  'division',
  'contactNumber',
  'rollNo',
  'department',
  'designation'
];

export const authStorage = {
  getItem: (key) => {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },

  setItem: (key, value) => {
    try {
      sessionStorage.setItem(key, value);
      // Remove from localStorage to prevent cross-tab contamination
      localStorage.removeItem(key);
    } catch (e) {
      console.error('authStorage.setItem error:', e);
    }
  },

  removeItem: (key) => {
    try {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    } catch (e) {
      console.error('authStorage.removeItem error:', e);
    }
  },

  clear: () => {
    try {
      sessionStorage.clear();
      AUTH_KEYS.forEach((k) => {
        try {
          localStorage.removeItem(k);
        } catch {}
      });
    } catch (e) {
      console.error('authStorage.clear error:', e);
    }
  },

  // One-time utility to purge legacy shared localStorage auth data
  purgeLegacySharedStorage: () => {
    try {
      AUTH_KEYS.forEach((k) => {
        localStorage.removeItem(k);
      });
    } catch {}
  }
};
