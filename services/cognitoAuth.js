import 'react-native-get-random-values';
import { Platform } from 'react-native';
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
} from '../constants/cognito';
import { signInWithToken, clearStoredAuthToken } from '../lib/auth';
import { ensureUserAfterSignup } from '../lib/userApi';

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

const ERROR_MESSAGES = {
  'user-not-found':
    'No account found for this email. If you signed up with Google or Apple on the website, use Sign in with Apple here.',
  'wrong-password':
    'Incorrect password, or this account uses Google/Apple sign-in from the website. Try Sign in with Apple, or reset your password at puzzleinteract.com.',
  'user-not-confirmed': 'Please confirm your email before signing in.',
  'password-reset-required': 'You must reset your password before signing in.',
  'invalid-input': 'Enter your email and password.',
  'invalid-parameter': 'Sign-in could not be completed. Check your email and password and try again.',
  'too-many-attempts': 'Too many attempts. Please wait a few minutes and try again.',
  generic: 'Sign-in failed. Please try again.',
};

export function signInErrorMessage(errorKey) {
  return ERROR_MESSAGES[errorKey] || ERROR_MESSAGES.generic;
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
    const cognitoUser = new CognitoUser({ Username: username, Pool: userPool });
    const authDetails = new AuthenticationDetails({
      Username: username,
      Password: password,
    });

    cognitoUser.authenticateUser(authDetails, {
      onSuccess: (session) => {
        resolve(session.getIdToken().getJwtToken());
      },
      onFailure: (error) => {
        reject(error);
      },
      newPasswordRequired: () => {
        const error = new Error('Password reset required');
        error.name = 'PasswordResetRequiredException';
        reject(error);
      },
    });
  });
}

function pickTokenField(obj, ...keys) {
  for (const key of keys) {
    const value = obj?.[key];
    if (value != null && String(value).trim()) return String(value).trim();
  }
  return null;
}

function parseAppleExchangeResponse(json) {
  const nested =
    json?.AuthenticationResult || json?.authenticationResult || json?.tokens || json?.data;
  const ar = nested && typeof nested === 'object' ? nested : json;
  const idToken = pickTokenField(ar, 'IdToken', 'idToken', 'id_token');
  if (!idToken) {
    throw new Error(json?.message || json?.error || 'Apple sign-in exchange failed.');
  }
  return idToken;
}

function isAppleSignInCancelled(error) {
  if (!error) return false;
  if (error.code === 'ERR_REQUEST_CANCELED') return true;
  const msg = String(error.message || '').toLowerCase();
  return msg.includes('cancel');
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
        return { success: false, errorKey: 'generic', message: 'Sign-in did not return a token.' };
      }
      await signInWithToken(idToken);
      await ensureUserAfterSignup();
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

export async function signInWithApple() {
  if (Platform.OS !== 'ios') {
    throw new Error('Sign in with Apple is available on iPhone only.');
  }

  const AppleAuthentication = await import('expo-apple-authentication');

  const available = await AppleAuthentication.isAvailableAsync();
  if (!available) {
    throw new Error('Sign in with Apple is not available on this device.');
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
    throw new Error('Sign in with Apple did not return an identity token.');
  }

  const response = await fetch(APPLE_NATIVE_EXCHANGE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      appleIdentityToken,
      iosJwtAudience: APPLE_NATIVE_JWT_AUDIENCE,
    }),
  });

  const text = await response.text();
  let json = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(text?.slice(0, 200) || `Apple sign-in failed (HTTP ${response.status})`);
  }

  if (!response.ok) {
    throw new Error(json.message || json.error || `Apple sign-in failed (HTTP ${response.status})`);
  }

  const idToken = parseAppleExchangeResponse(json);
  await signInWithToken(idToken);
  await ensureUserAfterSignup();
  return { success: true };
}

export async function signOutAll() {
  await clearStoredAuthToken();
}
