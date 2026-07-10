import { APP_STORE } from '../constants/store';
import { apiGet, apiPost } from './http';

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
  const body = {};
  if (claims && typeof claims === 'object') {
    if (claims.email) body.email = claims.email;
    if (claims['cognito:username'] || claims.sub) {
      body['cognito:username'] = claims['cognito:username'] || claims.sub;
    }
    if (claims.email_verified != null) body.email_verified = Boolean(claims.email_verified);
    if (claims.given_name) body.given_name = claims.given_name;
    if (claims.family_name) body.family_name = claims.family_name;
  }
  try {
    await apiPost('/home/user/after-signup', body);
  } catch {
    /* optional bootstrap */
  }
}
