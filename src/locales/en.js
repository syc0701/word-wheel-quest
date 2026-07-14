/** English (default) UI catalog — keys are shared across all locales. */
export default {
  // common
  'common.emDash': '—',
  'common.level': 'Level {n}',
  'common.levelFallback': 'Level',
  'common.play': 'Play',
  'common.daily': 'Daily',
  'common.words': '{n} words',
  'common.coins': '{n} coins',

  // home
  'home.a11y.settings': 'Settings',
  'home.kicker': 'PUZZLE COLLECTION',
  'home.title': 'Word Wheel Quest',
  'home.tagline': 'Swipe letters. Find every word.',
  'home.section.seasonJourney': 'Season Journey',
  'home.error.noData': 'No word wheel puzzle available yet.',
  'home.error.loadFailed': 'Could not load the next puzzle.',
  'home.error.missingData': 'Next puzzle response was missing puzzle data.',
  'home.error.generic': 'Failed to load puzzle',
  'home.section.more': 'More',
  'home.dailyPuzzle.label': 'Daily Puzzle',
  'home.dailyPuzzle.subtitle': "Today's bonus — separate from the season journey",
  'home.dailyPuzzle.lockedSubtitle': 'Unlocks at Level {n}',
  'home.dailyPuzzle.lockedTitle': 'Daily Puzzle Locked',
  'home.dailyPuzzle.lockedBody':
    'Reach Level {n} in the Season Journey to unlock the Daily Puzzle.',
  'home.dailyPuzzle.lockedOk': 'Got it',
  'home.footer':
    'Progress is saved on this device. Sign in once to move guest progress to your account.',

  // daily
  'daily.a11y.back': 'Back',
  'daily.kicker': 'BONUS PUZZLE',
  'daily.title': 'Daily Puzzle',
  'daily.subtitle': "Pick a date to preview and play that day's puzzle.",
  'daily.today': 'Today',
  'daily.weekday.sun': 'S',
  'daily.weekday.mon': 'M',
  'daily.weekday.tue': 'T',
  'daily.weekday.wed': 'W',
  'daily.weekday.thu': 'T',
  'daily.weekday.fri': 'F',
  'daily.weekday.sat': 'S',
  'daily.error.noData': 'No puzzle available for this date.',
  'daily.error.loadFailed': 'Failed to load daily puzzle',
  'daily.completed': 'Completed',
  'daily.meta': '{n} words · {size}×{size} grid',
  'daily.empty': 'No puzzle for this date.',
  'daily.replay': 'Replay',

  // play
  'play.clue.placeholder': 'Swipe the clue strip, or tap a numbered cell',
  'play.clue.prev': 'Previous clue',
  'play.clue.next': 'Next clue',
  'play.error.noDaily': 'No daily puzzle available.',
  'play.error.noPuzzle': 'No puzzle available.',
  'play.error.loadFailed': 'Could not load puzzle.',
  'play.error.generic': 'Failed to load',
  'play.error.saveFailed': 'Could not save progress',
  'play.alert.notEnoughCoins.title': 'Not enough coins',
  'play.alert.notEnoughCoins.body': 'Hints cost {n} coins per letter.',
  'play.alert.notEnoughCoins.ok': 'OK',
  'play.alert.notEnoughCoins.charge': 'Charge',
  'play.alert.noHint.title': 'No hint available',
  'play.alert.noHint.body': 'Every remaining letter is already visible on the grid.',
  'play.error.hintFailed': 'Could not use hint',
  'play.titleFallback': 'Word Wheel Quest',
  'play.clue.missing': 'No clue available.',
  'play.a11y.useHint': 'Use hint',
  'play.a11y.shuffle': 'Shuffle',
  'play.a11y.dictionary': 'Dictionary',

  // settings
  'settings.title': 'Settings',
  'settings.section.appearance': 'Appearance',
  'settings.section.language': 'Language',
  'settings.section.sound': 'Sound',
  'settings.section.account': 'Account',
  'settings.section.score': 'Score',
  'settings.section.shop': 'Shop',
  'settings.section.legal': 'Help & legal',
  'settings.section.developer': 'Developer',
  'settings.wallet.title': 'Your balance',
  'settings.wallet.puzzleCoins': 'Puzzle coins',
  'settings.wallet.credits': 'Credits',
  'settings.wallet.creditsSuffix': ' credits',
  'settings.wallet.hint':
    'Hints cost 10 coins per letter (or credits when coins run out).',
  'settings.score.wordsFound': 'Words found',
  'settings.score.rank': 'Rank',
  'settings.score.rankValue': '#{n}',
  'settings.score.empty': 'No score yet — finish puzzles to climb the board.',
  'settings.score.signInHint': 'Sign in to save and track your Word Wheel score.',
  'settings.score.hint': 'Score is your lifetime words found on the Word Wheel leaderboard.',
  'settings.account.signedInAs': 'Signed in as',
  'settings.account.signOut': 'Sign out',
  'settings.account.signIn': 'Sign in',
  'settings.account.signInSubtitle': 'Move guest progress to your account',
  'settings.shop.label': 'In-app purchases',
  'settings.shop.subtitle': 'Buy coins and bundles',
  'settings.dev.hint': 'Dev builds only — preview between-level screens',
  'settings.dev.wordMaster': 'Word Master',
  'settings.dev.wordMaster.subtitle': 'Level 1000 · Word Master popup',
  'settings.dev.streaksSparks': 'Streak Sparks',
  'settings.dev.streaksSparks.subtitle': 'Levels 100, 200… · +10 coins',
  'settings.dev.brainPower': 'Brain Power',
  'settings.dev.brainPower.subtitle': 'Levels 10, 20… · +5 coins',
  'settings.dev.completeDialog': 'Level Complete Dialog',
  'settings.dev.completeDialog.subtitle': 'Good job · time · Close / Next',
  'settings.appearance.a11y': 'Appearance',
  'settings.appearance.light': 'Light',
  'settings.appearance.dark': 'Dark',
  'settings.appearance.random': 'Random',
  'settings.appearance.randomHint': 'A new scene photo each week',
  'settings.sound.music': 'Play background music',
  'settings.sound.musicSubtitle': 'Loops on Home and Play',
  'settings.sound.sfx': 'Play sound effects',
  'settings.sound.sfxSubtitle': 'Clicks, correct, wrong, and win sounds',
  'settings.language.a11y': 'Language',

  // legal
  'legal.marketing': 'Marketing',
  'legal.privacy': 'Privacy Policy',
  'legal.terms': 'Terms of Use',
  'legal.support': 'Support',

  // sign in
  'signIn.title': 'Sign in to Word Wheel Quest',
  'signIn.legal.prefix': 'By continuing, you agree to our ',
  'signIn.legal.termsLink': 'Terms of Service',
  'signIn.legal.and': ' and ',
  'signIn.legal.privacyLink': 'Privacy Policy',
  'signIn.legal.period': '.',
  'signIn.legal.termsTitle': 'Terms of Use',
  'signIn.legal.privacyTitle': 'Privacy Policy',
  'signIn.placeholder.email': 'Email',
  'signIn.placeholder.password': 'Password',
  'signIn.button.email': 'Sign in',
  'signIn.divider': '— or —',
  'signIn.button.apple': ' Sign in with Apple',
  'signIn.apple.hint': 'Sign in with Apple is available on iPhone.',

  // shop
  'shop.title': 'Shop',
  'shop.alert.unavailable.title': 'Shop unavailable',
  'shop.alert.unavailable.body': 'Could not load products.',
  'shop.alert.productUnavailable.title': 'Unavailable',
  'shop.alert.productUnavailable.body':
    'This product is not loaded yet. Try again in a moment.',
  'shop.alert.success.title': 'Thank you!',
  'shop.alert.success.body': '{name} purchased successfully.',
  'shop.alert.purchaseFailed.title': 'Purchase failed',
  'shop.alert.purchaseFailed.body': 'Something went wrong.',
  'shop.alert.restored.title': 'Restored',
  'shop.alert.restored.body': 'Your purchases have been restored.',
  'shop.alert.restoreFailed.title': 'Restore failed',
  'shop.alert.restoreFailed.body': 'Could not restore purchases.',
  'shop.offeringHint': 'Offering `{id}` · Prices from the App Store.',
  'shop.restore': 'Restore purchases',

  // webview
  'webview.titleFallback': 'Page',

  // dev intermission
  'devIntermission.title.wordMaster': 'Word Master',
  'devIntermission.title.streaksSparks': 'Streaks & Sparks',
  'devIntermission.title.brainPower': 'Brain Power',
  'devIntermission.title.fallback': 'Intermission',
  'devIntermission.hint': 'Developer preview · {type}',

  // intermission
  'intermission.streak.unstoppable': 'UNSTOPPABLE!',
  'intermission.streak.onFire': 'ON FIRE!',
  'intermission.streak.sparkStreak': 'SPARK STREAK!',
  'intermission.streak.speedSpark': 'SPEED SPARK!',
  'intermission.streak.headline': 'STREAK SPARKS!',
  'intermission.streak.bonusLabel': 'Bonus coins',
  'intermission.streak.bonusCoins': '+{n}',
  'intermission.wordMaster.title': 'Word Master',
  'intermission.wordMaster.headline': 'Level Complete!',
  'intermission.levelComplete.headline': 'Level Complete!',
  'intermission.wordMaster.timeTaken': 'Time Taken',
  'intermission.wordMaster.starWord': 'Star Word',
  'intermission.duration.seconds': '{n}s',
  'intermission.streak.sessionLabel': 'Session streak',
  'intermission.streak.multiplier': '×{n}',
  'intermission.brainPower.headline': 'Brain Power',
  'intermission.brainPower.levelArrow': 'Level {from} ➔ Level {to}',
  'intermission.brainPower.capacity': 'Brain Capacity +25%',
  'intermission.brainPower.bonus': '+{n} Additional Coins',
  'intermission.continue': 'CONTINUE QUEST ➔',
  'intermission.a11y.continue': 'Continue quest',

  // complete dialog
  'complete.compliment.goodJob': 'Good job!',
  'complete.compliment.niceWork': 'Nice work!',
  'complete.compliment.wellDone': 'Well done!',
  'complete.compliment.awesome': 'Awesome!',
  'complete.compliment.brilliant': 'Brilliant!',
  'complete.compliment.youNailedIt': 'You nailed it!',
  'complete.compliment.greatSolve': 'Great solve!',
  'complete.compliment.fantastic': 'Fantastic!',
  'complete.compliment.impressive': 'Impressive!',
  'complete.compliment.wayToGo': 'Way to go!',
  'complete.stat.time': 'Time',
  'complete.stat.score': 'Score',
  'complete.stat.hints': 'Hints',
  'complete.hintsUsed': 'Hints used: −{n} coins',
  'complete.close': 'Close',
  'complete.next': 'Next',

  // dictionary
  'dictionary.error.load': 'Could not load definition.',
  'dictionary.loading': 'Loading definition…',
  'dictionary.empty': 'No definitions found.',
  'dictionary.attribution': 'Definitions from Wiktionary (CC BY-SA 3.0)',

  // toast
  'toast.dailyFallback': 'Daily',
  'toast.level': 'Level {n}',
  'toast.levelFallback': 'Level',
  'toast.words': '{n} words',
  'toast.maxScore': 'Up to +{n} score',
  'toast.guide':
    'Swipe letters on the wheel to spell words. Find every word on the grid to clear the level.',
  'toast.guideDaily':
    'Swipe letters on the wheel to spell words. Clear every word on today’s bonus grid.',

  // bonus word (off-grid dictionary find)
  'bonusWord.title': 'Word Discovery!',
  'bonusWord.bodyGift':
    'You found a real word that is not in this puzzle. We are giving you {n} coin right away!',
  'bonusWord.giftAmount': '+{n} coin',
  'bonusWord.ok': 'Nice!',

  // treasure chest (bonus words found)
  'treasureChest.title': 'Treasure Finds',
  'treasureChest.subtitle':
    'Real words you found that are not on this puzzle. Each new word earns +{n} coin once.',
  'treasureChest.empty':
    'No bonus words yet. Spell a real word that is not on the grid to stash it here.',
  'treasureChest.giftBadge': '+{n}',
  'treasureChest.close': 'Close',
  'treasureChest.openDictionary': 'Look up {word}',
  'play.a11y.treasureChest': 'Bonus words treasure chest',

  // points table
  'pointsTable.header.letters': 'Letters',
  'pointsTable.header.coins': 'Coins',
  'pointsTable.empty': 'Coins catalog unavailable.',
  'pointsTable.row.letters': '{n} letters',
  'pointsTable.footer':
    'Puzzle score is the sum of coins for every word you find.',

  // duration
  'duration.lessThanMinute': 'Less than a minute',
  'duration.seconds': '{n}s',
  'duration.hoursMinutes': '{hrs}h {rem}m',
  'duration.hours': '{hrs}h',
  'duration.minutesSeconds': '{mins}m {secs}s',
  'duration.minutes': '{mins}m',

  // wallet
  'wallet.error.loadFailed': 'Failed to load wallet',

  // auth
  'auth.error.userNotFound':
    'No account found for this email. If you signed up with Google or Apple on the website, use Sign in with Apple here.',
  'auth.error.wrongPassword':
    'Incorrect password, or this account uses Google/Apple sign-in from the website. Try Sign in with Apple, or reset your password at puzzleinteract.com.',
  'auth.error.userNotConfirmed': 'Please confirm your email before signing in.',
  'auth.error.passwordResetRequired':
    'You must reset your password before signing in.',
  'auth.error.invalidInput': 'Enter your email and password.',
  'auth.error.invalidParameter':
    'Sign-in could not be completed. Check your email and password and try again.',
  'auth.error.tooManyAttempts':
    'Too many attempts. Please wait a few minutes and try again.',
  'auth.error.generic': 'Sign-in failed. Please try again.',
  'auth.error.noToken': 'Sign-in did not return a token.',
  'auth.apple.iosOnly': 'Sign in with Apple is available on iPhone only.',
  'auth.apple.unavailable': 'Sign in with Apple is not available on this device.',
  'auth.apple.noIdentityToken': 'Sign in with Apple did not return an identity token.',
  'auth.apple.exchangeFailed': 'Apple sign-in exchange failed.',
  'auth.apple.httpFailed': 'Apple sign-in failed (HTTP {status})',
};
