/** Bundled Simber Chill Simple Lofi BGM + UI SFX. */

/** Home and other non-play screens. */
export const HOME_BGM_TRACKS = [
  require('../assets/audio/Smb_CSL_Relaxing_Piano_Melo_70_Ab.m4a'),
];

/** Puzzle play — remaining tracks from assets/audio (+ unique lofi-only). */
export const PLAY_BGM_TRACKS = [
  require('../assets/audio/Smb_CSL_Pitched_EPiano_57_E.m4a'),
  require('../assets/audio/Smb_CSL_Low_Ambient_Syn_Pad_58_Ab.m4a'),
  require('../assets/audio/Smb_CSL_Chill_Piano_Melo_56_G.m4a'),
  require('../assets/audio/Smb_CSL_Clean_Chill_EPiano_70_Ab.m4a'),
  require('../assets/audio/Smb_CSL_High_Melo_EPiano_54_F.m4a'),
  require('../assets/audio/Smb_CSL_Chill_Dist_Guitar_54_Dm.m4a'),
  require('../assets/audio/Smb_CSL_Sleepy_Melody_Guitar_56_Gm.m4a'),
  require('../assets/audio/lofi/Smb_CSL_High_Sweet_Piano_70_C.m4a'),
  require('../assets/audio/lofi/Smb_CSL_Very_Wet_Guitar_56_C.wav'),
];

export const AUDIO = {
  click: require('../assets/audio/universfield-ui-button-click-147358.mp3'),
  correct: require('../assets/audio/cartoon-music-game-sfx-correct-game-show-alert-494539.mp3'),
  wrong: require('../assets/audio/freesound_community-wrong-47985.mp3'),
  complete: require('../assets/audio/puyopuyomegafan1234-winner-game-sound-404167.mp3'),
  levelUp: require('../assets/audio/cartoon-music-game-sfx-level-up-retro-video-game-533840.mp3'),
  bonus: require('../assets/audio/universfield-game-bonus-144751.mp3'),
  whoosh: require('../assets/audio/mixkit-fast-sweep-transition-174.mp3'),
  chime: require('../assets/audio/mixkit-page-forward-single-chime-1107.mp3'),
};

export const BGM_SCENES = {
  HOME: 'home',
  PLAY: 'play',
  NONE: 'none',
};

export function pickRandomBgmTrack(scene) {
  const pool =
    scene === BGM_SCENES.HOME
      ? HOME_BGM_TRACKS
      : scene === BGM_SCENES.PLAY
        ? PLAY_BGM_TRACKS
        : null;
  if (!pool?.length) return null;
  const index = Math.floor(Math.random() * pool.length);
  return { source: pool[index], id: `${scene}:${index}` };
}
