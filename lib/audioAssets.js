/** Bundled tracks from assets/audio — main BGM, play BGM, and SFX. */

export const AUDIO = {
  homeBgm: require('../assets/audio/freesound_community-short-game-music-loop-38898.mp3'),
  playBgm: require('../assets/audio/xtremefreddy-game-music-loop-6-144641.mp3'),
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
