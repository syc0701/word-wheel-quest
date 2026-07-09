import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'word_wheel_session';

function createSessionId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === 'x' ? r : (r % 4) + 8;
    return v.toString(16);
  });
}

export async function clearWordWheelSession() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export async function getOrCreateWordWheelSession() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.sessionId && parsed?.createdAt) {
        return parsed;
      }
    }
  } catch {
    /* ignore */
  }
  const session = {
    sessionId: createSessionId(),
    createdAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  return session;
}

export async function getWordWheelSession() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.sessionId && parsed?.createdAt) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}
