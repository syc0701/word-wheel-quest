/** Bundled Simber Chill Simple Lofi BGM + UI SFX. */

/** Home and other non-play screens. */
export const HOME_BGM_TRACKS = [
  require('../assets/audio/Smb_CSL_Relaxing_Piano_Melo_70_Ab.m4a'),
];

/** Puzzle play — cycle through these on each play-screen entry. */
export const PLAY_BGM_TRACKS = [
  require('../assets/audio/Smb_CSL_Pitched_EPiano_57_E.m4a'),
  require('../assets/audio/Smb_CSL_Low_Ambient_Syn_Pad_58_Ab.m4a'),
  require('../assets/audio/Smb_CSL_Chill_Piano_Melo_56_G.m4a'),
  require('../assets/audio/Smb_CSL_Clean_Chill_EPiano_70_Ab.m4a'),
  require('../assets/audio/Smb_CSL_High_Melo_EPiano_54_F.m4a'),
  require('../assets/audio/Smb_CSL_Chill_Dist_Guitar_54_Dm.m4a'),
  require('../assets/audio/Smb_CSL_Sleepy_Melody_Guitar_56_Gm.m4a'),
  // Smb_CSL_High_Sweet_Piano_70_C.m4a is truncated (~3.4s) — omit so it does not loop as a chirp.
  require('../assets/audio/Smb_CSL_Very_Wet_Guitar_56_C.m4a'),
];

export const AUDIO = {
  click: require('../assets/audio-effect/universfield-ui-button-click-147358.mp3'),
  correct: require('../assets/audio-effect/cartoon-music-game-sfx-correct-game-show-alert-494539.mp3'),
  wrong: require('../assets/audio-effect/freesound_community-wrong-47985.mp3'),
  complete: require('../assets/audio-effect/puyopuyomegafan1234-winner-game-sound-404167.mp3'),
  levelUp: require('../assets/audio-effect/cartoon-music-game-sfx-level-up-retro-video-game-533840.mp3'),
  bonus: require('../assets/audio-effect/universfield-game-bonus-144751.mp3'),
  whoosh: require('../assets/audio-effect/mixkit-fast-sweep-transition-174.mp3'),
  purchaseWin: require('../assets/audio-effect/mixkit-ethereal-fairy-win-sound-2019.wav'),
  adReward: require('../assets/audio-effect/mixkit-retro-game-notification-212.wav'),
};

export const BGM_SCENES = {
  HOME: 'home',
  PLAY: 'play',
  NONE: 'none',
};

/** Advances on each new play BGM pick so re-entering play is not the same loop. */
let playBgmCursor = -1;

/**
 * Pick BGM for a screen.
 * Play tracks rotate through the pool whenever `rotate` is true (each play entry).
 * @param {string} scene
 * @param {number} [journeyLevel] unused for play rotation; kept for call-site compatibility
 * @param {{ rotate?: boolean }} [options]
 */
export function pickBgmTrack(scene, journeyLevel = 0, options = {}) {
  const rotate = Boolean(options?.rotate);
  const pool =
    scene === BGM_SCENES.HOME
      ? HOME_BGM_TRACKS
      : scene === BGM_SCENES.PLAY
        ? PLAY_BGM_TRACKS
        : null;
  if (!pool?.length) return null;

  let index = 0;
  if (scene === BGM_SCENES.PLAY) {
    if (rotate || playBgmCursor < 0) {
      playBgmCursor = (playBgmCursor + 1) % pool.length;
    }
    index = playBgmCursor;
    return { source: pool[index], id: `${scene}:rot:${index}` };
  }

  return { source: pool[index], id: `${scene}:0` };
}

/** @deprecated Prefer {@link pickBgmTrack}. */
export function pickRandomBgmTrack(scene, journeyLevel = 0) {
  return pickBgmTrack(scene, journeyLevel, { rotate: true });
}
