/**
 * auth.js — Student Notes App Authentication
 * localStorage-based auth (no backend required)
 */

const AUTH_USERS_KEY = 'sna_users';
const AUTH_SESSION_KEY = 'sna_session';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function _simpleHash(str) {
  // Basic obfuscation — NOT cryptographically secure, suitable for demo
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h = ((h << 5) - h) + ch;
    h |= 0;
  }
  return 'h_' + Math.abs(h).toString(36) + '_' + btoa(unescape(encodeURIComponent(str))).slice(0, 8);
}

function _getUsers() {
  try { return JSON.parse(localStorage.getItem(AUTH_USERS_KEY)) || {}; } catch(e) { return {}; }
}

function _saveUsers(users) {
  try { localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users)); } catch(e) {}
}

function _getSession() {
  try { return JSON.parse(localStorage.getItem(AUTH_SESSION_KEY)) || null; } catch(e) { return null; }
}

function _saveSession(session) {
  try { localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session)); } catch(e) {}
}

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

/**
 * Register a new user
 * @returns {object} { success: bool, error?: string }
 */
function authRegister(email, password, name) {
  email = (email || '').trim().toLowerCase();
  name  = (name  || '').trim();
  if (!email || !password) return { success: false, error: 'Email and password are required.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { success: false, error: 'Invalid email address.' };
  if (password.length < 6) return { success: false, error: 'Password must be at least 6 characters.' };
  if (!name) return { success: false, error: 'Display name is required.' };

  const users = _getUsers();
  if (users[email]) return { success: false, error: 'An account with this email already exists.' };

  users[email] = {
    email,
    name,
    passwordHash: _simpleHash(password),
    createdAt: Date.now(),
    avatar: name.charAt(0).toUpperCase()
  };
  _saveUsers(users);

  // Auto-login after register
  _saveSession({ email, name, avatar: users[email].avatar, loggedInAt: Date.now() });
  return { success: true };
}

/**
 * Login existing user
 * @returns {object} { success: bool, error?: string }
 */
function authLogin(email, password) {
  email = (email || '').trim().toLowerCase();
  if (!email || !password) return { success: false, error: 'Email and password are required.' };

  const users = _getUsers();
  const user = users[email];
  if (!user) return { success: false, error: 'No account found with this email.' };
  if (user.passwordHash !== _simpleHash(password)) return { success: false, error: 'Incorrect password.' };

  _saveSession({ email, name: user.name, avatar: user.avatar, loggedInAt: Date.now() });
  return { success: true };
}

/**
 * Logout the current user
 */
function authLogout() {
  try { localStorage.removeItem(AUTH_SESSION_KEY); } catch(e) {}
}

/**
 * Get current logged-in user
 * @returns {object|null}
 */
function authGetCurrentUser() {
  return _getSession();
}

/**
 * Check if a user is logged in
 * @returns {boolean}
 */
function authIsLoggedIn() {
  return !!_getSession();
}

/**
 * Require authentication — redirects to auth.html if not logged in
 * @param {string} [redirectBack] — URL to redirect to after login
 */
function authRequire(redirectBack) {
  if (!authIsLoggedIn()) {
    const url = 'auth.html' + (redirectBack ? '?next=' + encodeURIComponent(redirectBack) : '');
    window.location.href = url;
  }
}

/**
 * Update user profile name
 */
function authUpdateName(newName) {
  const session = _getSession();
  if (!session) return false;
  const users = _getUsers();
  if (!users[session.email]) return false;
  users[session.email].name = newName;
  users[session.email].avatar = newName.charAt(0).toUpperCase();
  _saveUsers(users);
  session.name = newName;
  session.avatar = newName.charAt(0).toUpperCase();
  _saveSession(session);
  return true;
}
