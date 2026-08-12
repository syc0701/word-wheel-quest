import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { apiPost } from './http';

export const FEEDBACK_CATEGORIES = [
  { value: 'puzzles', labelKey: 'settings.feedback.category.puzzles' },
  { value: 'gameplay', labelKey: 'settings.feedback.category.gameplay' },
  { value: 'bugs', labelKey: 'settings.feedback.category.bugs' },
  { value: 'shop', labelKey: 'settings.feedback.category.shop' },
  { value: 'other', labelKey: 'settings.feedback.category.other' },
];

export const FEEDBACK_OPINION_MAX_LENGTH = 500;

export const FEEDBACK_APP_NAME = 'Word Wheel Quest';

export function collectFeedbackDeviceInfo() {
  const appVersion = String(
    Constants.nativeBuildVersion
      || Constants.expoConfig?.android?.versionCode
      || Constants.expoConfig?.ios?.buildNumber
      || ''
  );
  let osLabel = Platform.OS;
  if (Platform.OS === 'android') {
    const release = Platform.constants?.Release;
    osLabel = release ? `Android ${release}` : `Android API ${Platform.Version}`;
  } else if (Platform.OS === 'ios') {
    osLabel = `iOS ${Platform.Version}`;
  }
  return {
    appName: FEEDBACK_APP_NAME,
    appVersion,
    osLabel,
    platform: Platform.OS,
    deviceLine: `App: ${FEEDBACK_APP_NAME} | App Version: ${appVersion} | OS: ${osLabel}`,
  };
}

export function buildFeedbackComment({ categoryLabel, opinion, deviceLine }) {
  return [`Category: ${categoryLabel}`, '', opinion.trim(), '', '---', deviceLine].join('\n');
}

/**
 * Settings feedback — posts to /home/feedback.
 * Only category, opinion, and device/app meta are stored (no account / PII fields).
 */
export async function submitAppFeedback({ categoryLabel, opinion, deviceInfo }) {
  const comment = buildFeedbackComment({
    categoryLabel,
    opinion,
    deviceLine: deviceInfo.deviceLine,
  });
  const data = await apiPost('/home/feedback', {
    gridId: null,
    crossId: null,
    cloudUserId: null,
    stars: null,
    difficultyDelta: null,
    comment,
    category: categoryLabel,
    appName: deviceInfo.appName,
    appVersion: deviceInfo.appVersion,
    os: deviceInfo.osLabel,
    platform: deviceInfo.platform,
    details: {
      appName: deviceInfo.appName,
      appVersion: deviceInfo.appVersion,
      category: categoryLabel,
      os: deviceInfo.osLabel,
      platform: deviceInfo.platform,
    },
  });
  if (data?.code === 'FAILURE') {
    throw new Error(data.message || 'Failed to submit feedback');
  }
  return data;
}
