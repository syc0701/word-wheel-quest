import { AppState, Platform } from 'react-native';

function waitUntilAppActive() {
  if (AppState.currentState === 'active') return Promise.resolve();
  return new Promise((resolve) => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        sub.remove();
        resolve();
      }
    });
  });
}

/**
 * iOS 14+: show the system ATT prompt while the app is active, before ads start.
 * Must run on a physical device / iOS 14+; no-ops elsewhere.
 */
export async function requestTrackingPermissionIfNeeded() {
  if (Platform.OS !== 'ios') return { status: 'unavailable' };
  await waitUntilAppActive();
  try {
    const { requestTrackingPermissionsAsync } = await import('expo-tracking-transparency');
    return await requestTrackingPermissionsAsync();
  } catch {
    return { status: 'unavailable' };
  }
}
