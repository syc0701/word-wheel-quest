import { AppState } from 'react-native';
import { createAudioPlayer, setAudioModeAsync, setIsAudioActiveAsync } from 'expo-audio';
import { BGM_SCENES, AUDIO, pickBgmTrack } from './audioAssets';
import { getSceneBandForLevel } from './bgAssets';

const BGM_VOLUME = 0.55;
const SFX_VOLUME = 0.85;
/** ExoPlayer on physical devices often needs longer than 300ms to buffer. */
const PLAY_RETRY_MS = [200, 500, 1000, 2000, 4000];

let modeConfigured = false;
let musicEnabled = true;
let sfxEnabled = true;
let scene = BGM_SCENES.NONE;
let journeyLevel = 0;
let journeyBand = 0;
let activeBgmId = null;
let activeBgmSource = null;
let bgmPlayer = null;
let sfxPlayers = new Map();
let appStateSub = null;
let playRetryTimers = [];
let bgmStatusSub = null;

function clearPlayRetries() {
  playRetryTimers.forEach((id) => clearTimeout(id));
  playRetryTimers = [];
  if (bgmStatusSub) {
    try {
      bgmStatusSub.remove();
    } catch {
      /* ignore */
    }
    bgmStatusSub = null;
  }
}

async function activateAudioSession() {
  try {
    await setIsAudioActiveAsync(true);
  } catch {
    /* ignore */
  }

  if (modeConfigured) return;

  try {
    // Android needs doNotMix (permanent focus) for looping BGM.
    // duckOthers maps to TRANSIENT focus and can kill long music.
    await setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: false,
      interruptionMode: 'mixWithOthers',
      interruptionModeAndroid: 'doNotMix',
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false,
    });
    modeConfigured = true;
  } catch {
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        interruptionModeAndroid: 'doNotMix',
      });
      modeConfigured = true;
    } catch {
      /* ignore — still try to play */
    }
  }

  ensureAppStateListener();
}

function ensureAppStateListener() {
  if (appStateSub) return;
  appStateSub = AppState.addEventListener('change', (next) => {
    if (next === 'active') {
      soundManager.resumeBgm();
    }
  });
}

function bgmSceneHasTracks(nextScene) {
  return nextScene === BGM_SCENES.HOME || nextScene === BGM_SCENES.PLAY;
}

function destroyBgmPlayer() {
  clearPlayRetries();
  if (!bgmPlayer) return;
  try {
    bgmPlayer.pause();
  } catch {
    /* ignore */
  }
  try {
    bgmPlayer.remove();
  } catch {
    /* ignore */
  }
  bgmPlayer = null;
  activeBgmSource = null;
}

function playBgmNow() {
  if (!bgmPlayer || !musicEnabled || !bgmSceneHasTracks(scene)) return;
  try {
    bgmPlayer.loop = true;
    bgmPlayer.volume = BGM_VOLUME;
    bgmPlayer.muted = false;
    bgmPlayer.play();
  } catch {
    /* ignore */
  }
}

function schedulePlayRetries() {
  clearPlayRetries();
  if (!bgmPlayer) return;

  // Prefer status callback when the first buffer is ready.
  try {
    bgmStatusSub = bgmPlayer.addListener('playbackStatusUpdate', (status) => {
      if (!musicEnabled || !bgmSceneHasTracks(scene) || !bgmPlayer) return;
      if (status?.isLoaded && !status?.playing && !bgmPlayer.playing) {
        playBgmNow();
      }
    });
  } catch {
    /* older expo-audio — retries below still help */
  }

  if (bgmPlayer.isLoaded) {
    playBgmNow();
  }

  PLAY_RETRY_MS.forEach((ms) => {
    playRetryTimers.push(
      setTimeout(() => {
        try {
          if (
            bgmPlayer
            && musicEnabled
            && bgmSceneHasTracks(scene)
            && !bgmPlayer.playing
          ) {
            playBgmNow();
          }
        } catch {
          /* ignore */
        }
      }, ms)
    );
  });
}

function ensureBgmPlayer(source) {
  // replace() is flaky on some Android devices — recreate when the track changes.
  if (bgmPlayer && activeBgmSource === source) {
    try {
      bgmPlayer.loop = true;
      bgmPlayer.volume = BGM_VOLUME;
      bgmPlayer.muted = false;
    } catch {
      /* ignore */
    }
    return bgmPlayer;
  }

  destroyBgmPlayer();
  try {
    bgmPlayer = createAudioPlayer(source, 500);
    activeBgmSource = source;
    bgmPlayer.loop = true;
    bgmPlayer.volume = BGM_VOLUME;
    bgmPlayer.muted = false;
  } catch {
    bgmPlayer = null;
    activeBgmSource = null;
    return null;
  }
  return bgmPlayer;
}

async function applyBgm({ forceRestart = false, pickNew = false } = {}) {
  await activateAudioSession();

  if (!musicEnabled || !bgmSceneHasTracks(scene)) {
    clearPlayRetries();
    if (bgmPlayer?.playing) {
      try {
        bgmPlayer.pause();
      } catch {
        /* ignore */
      }
    }
    return;
  }

  const scenePrefix = `${scene}:`;
  if (pickNew || !activeBgmId?.startsWith(scenePrefix)) {
    const pick = pickBgmTrack(scene, journeyLevel);
    if (!pick) return;
    const player = ensureBgmPlayer(pick.source);
    if (!player) return;
    activeBgmId = pick.id;
    forceRestart = true;
  }

  if (!bgmPlayer) {
    // Preference said music on, but player was lost — pick again.
    const pick = pickBgmTrack(scene, journeyLevel);
    if (!pick) return;
    const player = ensureBgmPlayer(pick.source);
    if (!player) return;
    activeBgmId = pick.id;
    forceRestart = true;
  }

  if (forceRestart) {
    try {
      await bgmPlayer.seekTo(0);
    } catch {
      /* ignore — may not be loaded yet */
    }
  }

  schedulePlayRetries();
}

function getSfxPlayer(key) {
  const source = AUDIO[key];
  if (!source) return null;
  let player = sfxPlayers.get(key);
  if (!player) {
    try {
      player = createAudioPlayer(source, 500);
      player.volume = SFX_VOLUME;
      sfxPlayers.set(key, player);
    } catch {
      return null;
    }
  }
  return player;
}

export const soundManager = {
  async configure({ music, sfx } = {}) {
    const turningMusicOn = typeof music === 'boolean' && music && !musicEnabled;
    if (typeof music === 'boolean') musicEnabled = music;
    if (typeof sfx === 'boolean') sfxEnabled = sfx;

    if (!musicEnabled) {
      clearPlayRetries();
      if (bgmPlayer?.playing) {
        try {
          bgmPlayer.pause();
        } catch {
          /* ignore */
        }
      }
      return;
    }

    await applyBgm({
      forceRestart: true,
      pickNew: turningMusicOn || !activeBgmId,
    });
  },

  async setMusicEnabled(enabled) {
    musicEnabled = Boolean(enabled);
    if (!musicEnabled) {
      clearPlayRetries();
      if (bgmPlayer?.playing) {
        try {
          bgmPlayer.pause();
        } catch {
          /* ignore */
        }
      }
      return;
    }
    await applyBgm({ forceRestart: true, pickNew: !activeBgmId });
  },

  async setSfxEnabled(enabled) {
    sfxEnabled = Boolean(enabled);
  },

  /**
   * Keep play BGM in sync with journey level bands (same cadence as scene photos).
   */
  async setJourneyLevel(level) {
    const n = Number(level);
    if (!Number.isFinite(n) || n <= 0) return;
    const nextLevel = Math.floor(n);
    const nextBand = getSceneBandForLevel(nextLevel);
    const bandChanged = nextBand !== journeyBand;
    journeyLevel = nextLevel;
    journeyBand = nextBand;
    if (!bandChanged) return;
    if (!musicEnabled || !bgmSceneHasTracks(scene)) return;
    const pick = pickBgmTrack(scene, journeyLevel);
    if (!pick || pick.id === activeBgmId) return;
    await applyBgm({ forceRestart: true, pickNew: true });
  },

  async setScene(nextScene) {
    const next = nextScene || BGM_SCENES.NONE;
    if (scene === next) {
      if (musicEnabled && bgmSceneHasTracks(scene) && bgmPlayer && !bgmPlayer.playing) {
        await activateAudioSession();
        schedulePlayRetries();
      }
      return;
    }
    scene = next;
    if (!bgmSceneHasTracks(scene)) {
      activeBgmId = null;
      clearPlayRetries();
      if (bgmPlayer?.playing) {
        try {
          bgmPlayer.pause();
        } catch {
          /* ignore */
        }
      }
      return;
    }
    await applyBgm({ forceRestart: true, pickNew: true });
  },

  resumeBgm() {
    if (!musicEnabled || !bgmSceneHasTracks(scene)) return;
    activateAudioSession().then(() => {
      if (!bgmPlayer) {
        applyBgm({ forceRestart: true, pickNew: !activeBgmId });
        return;
      }
      if (!bgmPlayer.playing) schedulePlayRetries();
    });
  },

  async playSfx(key) {
    if (!sfxEnabled) return;
    await activateAudioSession();
    const player = getSfxPlayer(key);
    if (!player) return;
    try {
      await player.seekTo(0);
      player.volume = SFX_VOLUME;
      player.play();
    } catch {
      /* ignore */
    }
  },

  pauseBgm() {
    clearPlayRetries();
    if (bgmPlayer?.playing) {
      try {
        bgmPlayer.pause();
      } catch {
        /* ignore */
      }
    }
  },
};

export { BGM_SCENES };
