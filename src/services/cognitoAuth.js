import 'react-native-get-random-values';
import { Platform } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
} from 'amazon-cognito-identity-js';
import {
  APPLE_NATIVE_EXCHANGE_URL,
  APPLE_NATIVE_JWT_AUDIENCE,
  COGNITO_MOBILE_CLIENT_ID,
  COGNITO_USER_POOL_ID,
  GOOGLE_NATIVE_EXCHANGE_URL,
  GOOGLE_WEB_CLIENT_ID,
} from '../constants/cognito';
import { APP_STORE } from '../constants/store';
import { getAuthTokenClaims, signInWithToken, clearStoredAuthToken } from '../lib/auth';
import { t } from '../lib/i18n';
import { ensureUserAfterSignup } from '../lib/userApi';
import { isPurchasesConfigured } from './purchases';

const userPool = new CognitoUserPool({
  UserPoolId: COGNITO_USER_POOL_ID,
  ClientId: COGNITO_MOBILE_CLIENT_ID,
});

if (__DEV__ && typeof global.crypto?.getRandomValues !== 'function') {
  console.warn(
    '[SignIn] crypto.getRandomValues is missing — restart Metro with npm run run:metro and avoid Remote JS Debugging.'
  );
}

export function getSignInErrorKey(error) {
  const name = error?.name || error?.code || error?.__type || '';
  const normalized = String(name).replace(/^com\.amazonaws\.cognito\.idp\.model\./, '');
  if (normalized === 'UserNotFoundException') return 'user-not-found';
  if (normalized === 'NotAuthorizedException') return 'wrong-password';
  if (normalized === 'UserNotConfirmedException') return 'user-not-confirmed';
  if (normalized === 'PasswordResetRequiredException') return 'password-reset-required';
  if (normalized === 'InvalidParameterException') return 'invalid-parameter';
  if (normalized === 'TooManyRequestsException' || normalized === 'LimitExceededException') {
    return 'too-many-attempts';
  }
  return 'generic';
}

const ERROR_KEYS = {
  'user-not-found': 'auth.error.userNotFound',
  'wrong-password': 'auth.error.wrongPassword',
  'user-not-confirmed': 'auth.error.userNotConfirmed',
  'password-reset-required': 'auth.error.passwordResetRequired',
  'invalid-input': 'auth.error.invalidInput',
  'invalid-parameter': 'auth.error.invalidParameter',
  'too-many-attempts': 'auth.error.tooManyAttempts',
  generic: 'auth.error.generic',
};

export function signInErrorMessage(errorKey) {
  return t(ERROR_KEYS[errorKey] || ERROR_KEYS.generic);
}

function logSignInFailure(context) {
  if (!__DEV__) return;
  const { username, errorKey, error, clientId } = context;
  console.warn('[SignIn]', {
    username: username ? `${username.slice(0, 3)}…@${username.split('@')[1] ?? '?'}` : '(empty)',
    clientId,
    errorKey,
    name: error?.name ?? error?.__type,
    code: error?.code,
    message: error?.message,
    userPoolId: COGNITO_USER_POOL_ID,
  });
}

function usernameCandidates(username) {
  const trimmed = String(username || '').trim();
  if (!trimmed) return [];
  const lower = trimmed.toLowerCase();
  return trimmed === lower ? [trimmed] : [trimmed, lower];
}

function cognitoAuthenticate(username, password) {
  return new Promise((resolve, reject) => {
    const user = new CognitoUser({ Username: username, Pool: userPool });
    const authDetails = new AuthenticationDetails({
      Username: username,
      Password: password,
    });
    user.authenticateUser(authDetails, {
      onSuccess: (session) => {
        resolve(session.getIdToken().getJwtToken());
      },
      onFailure: (err) => reject(err),
      newPasswordRequired: () => {
        const error = new Error('Password reset required');
        error.name = 'PasswordResetRequiredException';
        reject(error);
      },
    });
  });
}

export async function loginWithPassword(email, password) {
  const pwd = String(password || '');
  const candidates = usernameCandidates(email);
  if (candidates.length === 0 || !pwd) {
    return { success: false, errorKey: 'invalid-input' };
  }

  let lastError = null;
  for (let i = 0; i < candidates.length; i += 1) {
    try {
      const idToken = await cognitoAuthenticate(candidates[i], pwd);
      if (!idToken) {
        return { success: false, errorKey: 'generic', message: t('auth.error.noToken') };
      }
      await signInWithToken(idToken);
      await ensureUserAfterSignup();
      await identifyPurchasesUser();
      return { success: true };
    } catch (error) {
      lastError = error;
      logSignInFailure({
        username: candidates[i],
        clientId: COGNITO_MOBILE_CLIENT_ID,
        errorKey: getSignInErrorKey(error),
        error,
      });
      const retryable = getSignInErrorKey(error) === 'user-not-found' && i < candidates.length - 1;
      if (!retryable) break;
    }
  }

  return {
    success: false,
    errorKey: getSignInErrorKey(lastError),
    message: lastError?.message,
    error: lastError,
  };
}

function pickTokenField(obj, ...keys) {
  for (const key of keys) {
    const value = obj?.[key];
    if (value != null && String(value).trim()) return String(value).trim();
  }
  return null;
}

function parseNativeExchangeResponse(json) {
  const nested =
    json?.AuthenticationResult || json?.authenticationResult || json?.tokens || json?.data;
  const ar = nested && typeof nested === 'object' ? nested : json;
  const idToken = pickTokenField(ar, 'IdToken', 'idToken', 'id_token');
  if (!idToken) {
    throw new Error(json?.message || json?.error || t('auth.google.exchangeFailed'));
  }
  return idToken;
}

function parseAppleExchangeResponse(json) {
  const nested =
    json?.AuthenticationResult || json?.authenticationResult || json?.tokens || json?.data;
  const ar = nested && typeof nested === 'object' ? nested : json;
  const idToken = pickTokenField(ar, 'IdToken', 'idToken', 'id_token');
  if (!idToken) {
    throw new Error(json?.message || json?.error || t('auth.apple.exchangeFailed'));
  }
  return idToken;
}

function isAppleSignInCancelled(error) {
  if (!error) return false;
  if (error.code === 'ERR_REQUEST_CANCELED') return true;
  const msg = String(error.message || '').toLowerCase();
  return msg.includes('cancel');
}

let googleConfigured = false;

function configureGoogleSignIn() {
  if (googleConfigured) return;
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    offlineAccess: false,
    scopes: ['email', 'profile'],
  });
  googleConfigured = true;
}

export async function identifyPurchasesUser() {
  if (!isPurchasesConfigured()) return;
  try {
    const Purchases = (await import('react-native-purchases')).default;
    const claims = await getAuthTokenClaims();
    const appUserId = claims?.sub;
    if (appUserId) {
      await Purchases.logIn(String(appUserId));
    }
  } catch {
    /* ignore */
  }
}

export async function signInWithApple() {
  if (Platform.OS !== 'ios') {
    throw new Error(t('auth.apple.iosOnly'));
  }

  const AppleAuthentication = await import('expo-apple-authentication');

  const available = await AppleAuthentication.isAvailableAsync();
  if (!available) {
    throw new Error(t('auth.apple.unavailable'));
  }

  let credential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
  } catch (error) {
    if (isAppleSignInCancelled(error)) {
      return { success: false, cancelled: true };
    }
    throw error;
  }

  const appleIdentityToken = credential?.identityToken;
  if (!appleIdentityToken) {
    throw new Error(t('auth.apple.noIdentityToken'));
  }

  const exchangeBody = {
    appleIdentityToken,
    iosJwtAudience: APPLE_NATIVE_JWT_AUDIENCE,
    bundleId: APP_STORE.bundleId,
  };
  if (credential.authorizationCode) {
    exchangeBody.authorizationCode = credential.authorizationCode;
  }
  if (credential.user) {
    exchangeBody.appleUser = credential.user;
  }
  if (credential.fullName) {
    exchangeBody.fullName = credential.fullName;
  }
  if (credential.email) {
    exchangeBody.email = credential.email;
  }

  const response = await fetch(APPLE_NATIVE_EXCHANGE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(exchangeBody),
  });

  const text = await response.text();
  let json = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(text?.slice(0, 200) || t('auth.apple.httpFailed', { status: response.status }));
  }

  if (!response.ok) {
    throw new Error(
      json.message || json.error || t('auth.apple.httpFailed', { status: response.status })
    );
  }

  const idToken = parseAppleExchangeResponse(json);
  await signInWithToken(idToken);
  await ensureUserAfterSignup();
  await identifyPurchasesUser();
  return { success: true };
}

export async function signInWithGoogle() {
  configureGoogleSignIn();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  let nativeResult;
  try {
    nativeResult = await GoogleSignin.signIn();
  } catch (error) {
    const code = String(error?.code || '');
    if (code === 'SIGN_IN_CANCELLED' || code === '12501') {
      return { success: false, cancelled: true };
    }
    if (code === '10' || code === 'DEVELOPER_ERROR') {
      throw new Error(t('auth.google.developerError'));
    }
    throw error;
  }

  if (nativeResult?.type === 'cancelled') {
    return { success: false, cancelled: true };
  }

  const googleIdentityToken =
    nativeResult?.type === 'success'
      ? nativeResult.data?.idToken
      : nativeResult?.idToken;
  if (!googleIdentityToken) {
    throw new Error(t('auth.google.noCode'));
  }

  const response = await fetch(GOOGLE_NATIVE_EXCHANGE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ googleIdentityToken }),
  });

  const text = await response.text();
  let json = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(text?.slice(0, 200) || t('auth.google.exchangeFailed'));
  }

  if (!response.ok) {
    throw new Error(json.message || json.error || t('auth.google.exchangeFailed'));
  }

  const idToken = parseNativeExchangeResponse(json);
  await signInWithToken(idToken);
  await ensureUserAfterSignup();
  await identifyPurchasesUser();
  return { success: true };
}

export async function signOutAll() {
  await clearStoredAuthToken();
  if (Platform.OS === 'android') {
    try {
      const { clearPlayIntegrityCache } = require('../lib/playIntegrity');
      clearPlayIntegrityCache();
    } catch {
      /* ignore */
    }
  }
  try {
    configureGoogleSignIn();
    await GoogleSignin.signOut();
  } catch {
    /* ignore */
  }
  try {
    if (isPurchasesConfigured()) {
      const Purchases = (await import('react-native-purchases')).default;
      await Purchases.logOut();
    }
  } catch {
    /* ignore */
  }
}
