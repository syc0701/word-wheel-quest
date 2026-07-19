import 'react-native-get-random-values';
import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
} from 'amazon-cognito-identity-js';
import {
  COGNITO_MOBILE_CLIENT_ID,
  COGNITO_USER_POOL_ID,
} from '../constants/cognito';
import { signInWithToken, clearStoredAuthToken } from '../lib/auth';
import { t } from '../lib/i18n';
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

export async function signOutAll() {
  await clearStoredAuthToken();
  try {
    const { clearPlayIntegrityCache } = require('../lib/playIntegrity');
    clearPlayIntegrityCache();
  } catch {
    /* ignore */
  }
}
