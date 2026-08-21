import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = 'word_wheel_auth_token';

export async function getStoredAuthToken() {
  try {
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

async function setStoredAuthToken(token) {
  if (!token) {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    return;
  }
  await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
}

export async function clearStoredAuthToken() {
  try {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

function tokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch {
    return true;
  }
}

/** Decode JWT payload claims without verifying signature (display / debug only). */
export function decodeAuthTokenClaims(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const json =
      typeof atob === 'function'
        ? atob(padded)
        : Buffer.from(padded, 'base64').toString('utf8');
    const claims = JSON.parse(json);
    return claims && typeof claims === 'object' ? claims : null;
  } catch {
    return null;
  }
}

export async function getAuthTokenClaims() {
  const token = await getAuthToken();
  return decodeAuthTokenClaims(token);
}

export async function getAuthToken() {
  const token = await getStoredAuthToken();
  if (!token || tokenExpired(token)) {
    if (token) await clearStoredAuthToken();
    return null;
  }
  return token;
}

export async function buildAuthHeaders(extra = {}) {
  const headers = { Accept: 'application/json', ...extra };
  const token = await getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function isLoggedIn() {
  const token = await getAuthToken();
  return Boolean(token);
}

export async function signInWithToken(token) {
  if (!token || tokenExpired(token)) {
    throw new Error('Invalid or expired sign-in token');
  }
  await setStoredAuthToken(token);
}

export async function signOut() {
  await clearStoredAuthToken();
  try {
    const { clearPlayIntegrityCache } = require('./playIntegrity');
    clearPlayIntegrityCache();
  } catch {
    /* ignore */
  }
}
