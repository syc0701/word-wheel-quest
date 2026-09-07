import { Platform } from 'react-native';
import { APP_STORE } from '../constants/store';
import { getAuthToken, getAuthTokenClaims } from './auth';
import { apiGet, apiPost } from './http';

const DATA_DELETION_CODE_RE = /^[0-9a-fA-F]{16}$/;
const DATA_DELETION_TIMEOUT_MS = 60000;

/** Public SPA status page (not the REST endpoint). */
function deletionStatusUrl(confirmationCode) {
  return `https://www.puzzleinteract.com/deletion-status?code=${encodeURIComponent(confirmationCode)}`;
}

/** Cognito ID token `identities` is often a JSON string. */
function parseFederatedIdentities(identities) {
  if (!identities) return [];
  if (Array.isArray(identities)) return identities;
  if (typeof identities === 'string') {
    try {
      const parsed = JSON.parse(identities);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Federated subs + signup source for `/home/user/after-signup`.
 * Native app defaults to IOS/ANDROID when not Google/Apple federated.
 */
function federatedFromClaims(claims) {
  const list = parseFederatedIdentities(claims?.identities);
  const ordered = [...list].sort((a, b) => {
    const ap = a.primary === true || a.primary === 'true';
    const bp = b.primary === true || b.primary === 'true';
    if (ap && !bp) return -1;
    if (!ap && bp) return 1;
    return 0;
  });

  let googleSub = null;
  let appleSignInSub = null;
  let signupSource = null;

  for (const id of ordered) {
    const name = String(id.providerName || id.providerType || '');
    const userId = id.userId != null ? String(id.userId).trim() : '';
    if (!userId) continue;
    if (name === 'Google' || /^google$/i.test(name)) {
      googleSub = googleSub || userId;
      if (!signupSource) signupSource = 'GOOGLE';
    } else if (
      name === 'SignInWithApple' ||
      name === 'Apple' ||
      /^sign\s*in\s*with\s*apple$/i.test(name)
    ) {
      appleSignInSub = appleSignInSub || userId;
      if (!signupSource) signupSource = 'APPLE';
    }
  }

  return {
    googleSub,
    appleSignInSub,
    signupSource: signupSource || (Platform.OS === 'ios' ? 'IOS' : 'ANDROID'),
  };
}

export function resolveWordWheelQuestCoins(cloudUser) {
  const map = cloudUser?.puzzleCoins;
  if (!map || typeof map !== 'object') return 0;
  const n = Number(map[APP_STORE.appSiteId] ?? map.word_wheel_quest ?? map.total);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/**
 * Prefer JWT claims.given_name + claims.family_name, then claims.email.
 * Falls back to cloudUser profile fields only when claims are missing.
 */
export function resolveAccountLabel(cloudUser, claims) {
  const given = String(claims?.given_name || '').trim();
  const family = String(claims?.family_name || '').trim();
  const claimName = [given, family].filter(Boolean).join(' ').trim();
  if (claimName) return claimName;

  const claimEmail = String(claims?.email || '').trim();
  if (claimEmail) return claimEmail;

  const profileGiven = String(cloudUser?.firstName || cloudUser?.given_name || '').trim();
  const profileFamily = String(cloudUser?.lastName || cloudUser?.family_name || '').trim();
  const profileName = [profileGiven, profileFamily].filter(Boolean).join(' ').trim();
  if (profileName) return profileName;

  return String(cloudUser?.email || '').trim();
}

/** /home/user returns CloudUserRo at the top level (encrypted), not { cloudUser }. */
export function normalizeCloudUserPayload(userInfo) {
  if (!userInfo || typeof userInfo !== 'object') return null;
  if (userInfo.code === 'NO_DATA' || userInfo.code === 'FAILURE') return null;
  if (userInfo.cloudUser && typeof userInfo.cloudUser === 'object') {
    return userInfo.cloudUser;
  }
  if (
    userInfo.email != null
    || userInfo.puzzleCoins != null
    || userInfo.id != null
    || userInfo.firstName != null
    || userInfo.lastName != null
  ) {
    return userInfo;
  }
  return null;
}

export function summarizeUserIdentity(cloudUser, claims) {
  const claimKeys = claims && typeof claims === 'object' ? Object.keys(claims) : [];
  const pick = (obj, keys) => {
    if (!obj || typeof obj !== 'object') return {};
    const out = {};
    keys.forEach((k) => {
      if (obj[k] != null && obj[k] !== '') out[k] = obj[k];
    });
    return out;
  };
  return {
    displayLabel: resolveAccountLabel(cloudUser, claims),
    cloudUser: pick(cloudUser, [
      'id',
      'email',
      'firstName',
      'lastName',
      'username',
      'emailVerified',
      'puzzleCoins',
    ]),
    claims: pick(claims, [
      'email',
      'email_verified',
      'name',
      'given_name',
      'family_name',
      'preferred_username',
      'cognito:username',
      'sub',
    ]),
    claimKeys,
    wordWheelCoins: resolveWordWheelQuestCoins(cloudUser),
  };
}

export async function fetchUserInfo() {
  const data = await apiGet('/home/user');
  if (data?.code === 'FAILURE') {
    throw new Error(data.message || 'Failed to load user profile');
  }
  return data;
}

export async function ensureUserAfterSignup(claims = null) {
  let resolved = claims && typeof claims === 'object' ? claims : null;
  if (!resolved) {
    resolved = await getAuthTokenClaims().catch(() => null);
  }

  const body = {};
  if (resolved) {
    if (resolved.email) body.email = resolved.email;
    if (resolved['cognito:username'] || resolved.sub) {
      body['cognito:username'] = resolved['cognito:username'] || resolved.sub;
    }
    if (resolved.email_verified != null) {
      body.email_verified = Boolean(resolved.email_verified);
    }
    if (resolved.given_name) body.given_name = resolved.given_name;
    if (resolved.family_name) body.family_name = resolved.family_name;
  }

  // Always send a mobile signup source. Missing → backend defaults to WEB.
  const { googleSub, appleSignInSub, signupSource } = federatedFromClaims(resolved || {});
  body.signupSource = signupSource;
  if (googleSub) body.googleSub = googleSub;
  if (appleSignInSub) body.appleSignInSub = appleSignInSub;

  try {
    await apiPost('/home/user/after-signup', body);
  } catch {
    /* optional bootstrap */
  }
}

/**
 * Permanently delete the signed-in account (App Store 5.1.1(v)).
 * POST /home/user/data-deletion — Cognito user + cloud data removed synchronously.
 * @returns {Promise<{ confirmationCode: string, statusUrl: string }>}
 */
export async function requestAccountDeletion() {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Authentication required. Sign out, sign in again, then retry.');
  }

  const claims = await getAuthTokenClaims();
  await ensureUserAfterSignup(claims);

  const data = await apiPost(
    '/home/user/data-deletion',
    {
      platform: Platform.OS === 'ios' ? 'apple' : 'android',
      appId: APP_STORE.appSiteId,
    },
    { timeoutMs: DATA_DELETION_TIMEOUT_MS }
  );
  if (data?.code === 'FAILURE') {
    const message = String(data.message || '').trim();
    if (/authentication required/i.test(message) || /missing or invalid jwt/i.test(message)) {
      throw new Error('Authentication required. Sign out, sign in again, then retry.');
    }
    throw new Error(message || 'Failed to delete account.');
  }

  const confirmationCode = String(
    data?.confirmation_code ?? data?.confirmationCode ?? ''
  ).trim();
  if (!confirmationCode || !DATA_DELETION_CODE_RE.test(confirmationCode)) {
    throw new Error('Account deletion response was incomplete. Please try again.');
  }

  // Always open the public web status page (Jigsaw pattern), not the raw REST url.
  return {
    confirmationCode,
    statusUrl: deletionStatusUrl(confirmationCode),
  };
}
