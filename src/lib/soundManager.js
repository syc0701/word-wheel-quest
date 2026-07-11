import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { AUDIO, BGM_SCENES } from './audioAssets';

const BGM_VOLUME = 0.38;
const SFX_VOLUME = 0.85;

let ready = false;
let musicEnabled = true;
let sfxEnabled = true;
let scene = BGM_SCENES.NONE;
let activeBgmKey = null;
let bgmPlayer = null;
let sfxPlayers = new Map();

async function ensureMode() {
  if (ready) return;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: false,
      interruptionMode: 'mixWithOthers',
      interruptionModeAndroid: 'duckOthers',
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false,
    });
  } catch {
    try {
      await setAudioModeAsync({ playsInSilentMode: true });
    } catch {
      /* ignore */
    }
  }
  ready = true;
}

function bgmKeyForScene(nextScene) {
  if (nextScene === BGM_SCENES.HOME) return 'homeBgm';
  if (nextScene === BGM_SCENES.PLAY) return 'playBgm';
  return null;
}

function ensureBgmPlayer(source) {
  if (!bgmPlayer) {
    bgmPlayer = createAudioPlayer(source);
  } else {
    try {
      bgmPlayer.replace(source);
    } catch {
      try {
        bgmPlayer.remove();
      } catch {
        /* ignore */
      }
      bgmPlayer = createAudioPlayer(source);
    }
  }
  bgmPlayer.loop = true;
  bgmPlayer.volume = BGM_VOLUME;
  return bgmPlayer;
}

async function applyBgm({ forceRestart = false } = {}) {
  await ensureMode();
  const key = bgmKeyForScene(scene);

  if (!musicEnabled || !key) {
    if (bgmPlayer?.playing) bgmPlayer.pause();
    return;
  }

  const source = AUDIO[key];
  const needsSwap = activeBgmKey !== key || !bgmPlayer;
  if (needsSwap) {
    ensureBgmPlayer(source);
    activeBgmKey = key;
    forceRestart = true;
  }

  if (forceRestart) {
    try {
      await bgmPlayer.seekTo(0);
    } catch {
      /* ignore */
    }
  }

  if (!bgmPlayer.playing) bgmPlayer.play();
}

function getSfxPlayer(key) {
  const source = AUDIO[key];
  if (!source) return null;
  let player = sfxPlayers.get(key);
  if (!player) {
    player = createAudioPlayer(source);
    player.volume = SFX_VOLUME;
    sfxPlayers.set(key, player);
  }
  return player;
}

export const soundManager = {
  async configure({ music, sfx } = {}) {
    if (typeof music === 'boolean') musicEnabled = music;
    if (typeof sfx === 'boolean') sfxEnabled = sfx;
    await applyBgm();
  },

  async setMusicEnabled(enabled) {
    musicEnabled = Boolean(enabled);
    if (!musicEnabled) {
      if (bgmPlayer?.playing) bgmPlayer.pause();
      return;
    }
    await applyBgm({ forceRestart: true });
  },

  async setSfxEnabled(enabled) {
    sfxEnabled = Boolean(enabled);
  },

  async setScene(nextScene) {
    const next = nextScene || BGM_SCENES.NONE;
    if (scene === next) {
      if (musicEnabled && bgmKeyForScene(scene) && bgmPlayer && !bgmPlayer.playing) {
        bgmPlayer.play();
      }
      return;
    }
    scene = next;
    await applyBgm({ forceRestart: true });
  },

  async playSfx(key) {
    if (!sfxEnabled) return;
    await ensureMode();
    const player = getSfxPlayer(key);
    if (!player) return;
    try {
      await player.seekTo(0);
      player.play();
    } catch {
      /* ignore */
    }
  },

  pauseBgm() {
    if (bgmPlayer?.playing) bgmPlayer.pause();
  },
};

export { BGM_SCENES };
