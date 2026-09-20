# Word Wheel Quest — Paywalls, Credits, Coins & Bonuses

How the app gates content, manages **puzzle credits**, **puzzle coins**, spending (hints), and bonus rewards. Values match the current client (`src/constants/guestAccess.js`, `src/lib/guestStarterPack.js`, `src/lib/points.js`, `src/hooks/useWordWheelWallet.js`).

> **Note:** The paywall / access section below reflects the **current client** (Season Journey is free). This policy will be revised later when we lock the next monetization rules.

---

## Paywalls & access (all users)

These rules apply to **guests and signed-in players**.

Constants (`src/constants/guestAccess.js`):

| Constant | Value | Meaning |
| --- | --- | --- |
| `GUEST_MAX_LEVEL_WITHOUT_STARTER` | **1_000_000** | Journey paywall off — all Season Journey levels treated as free |
| `GUEST_STARTER_UNLOCK_LEVEL` | max + 1 | Unused while journey is free |
| `GRANDFATHER_*` | legacy | Unused while journey paywall is off |
| `FREE_DAILY_PLAYS` | legacy | Daily is free — no starter/credit gate to start a puzzle |
| `STARTER_PACK_PUZZLE_CREDITS` | **150** (server) | Starter credits land on the device wallet, not a local 50-credit grant |
| `PUZZLE_PLAY_CREDIT_COST` | unused for starts | Credits are spent on **letters**, not on starting a puzzle |

Product: **Starter Fun Bundle** (`bundle_starter` / `word_wheel_pack_starter`) in Shop.

### Season Journey

| Levels | Cost |
| --- | --- |
| **1–1100** | **Free** — no starter pack, no puzzle credits |

*(Previous policy gated level **51+** behind Starter + 1 credit/level, with a grandfather path through 59. That journey gate is **removed** for now.)*

### Daily Puzzle

Daily puzzles are free to start. There is no starter or credit gate on play.

### Credits

Credits reveal letters. They are not required to start Journey or Daily.

| Source | Credits |
| --- | --- |
| Starter / Classic / Master | Server amounts (150 / 50 / 110) on the **device wallet** (`mo_guest_credits`) |
| Watch rewarded ad | AdMob SSV grants **1** credit. The ad does not reveal a letter. The eye on the clue spends 1 credit on the selected word’s first hidden letter |
| Show 1 letter | Select a word first. Spends **1** credit on that word’s first still-hidden letter |

Leftover credits stay on the balance. They are not auto-applied to the next puzzle. After sign-in, guest credits merge onto the account and the app shows that balance.

### Starter Fun Bundle purchase

Google Play purchase → `CreditApi.verifyIapPurchase` with the install `deviceId`. Credits go to the device wallet even when signed out. If that wallet is empty, the client records **150** so it matches the Starter grant. Sign-in is not required to buy.

### Gate modals

| Situation | User sees |
| --- | --- |
| 0 credits and Show 1 letter / credit chip | Credit sheet: balance, Buy Starter, Watch ad |

Journey no longer shows the level-51 starter gate.

Implementation: `StarterPackGateModal`, `src/screens/PlayScreen.js`, `src/screens/DailyScreen.js`, `src/screens/ShopScreen.js`.

---

## Three “balances” (don’t confuse them)

| Balance | Purpose | Guest | Signed-in |
| --- | --- | --- | --- |
| **Puzzle coins** | Earned per word; spent on **hints** in Play | Session pool on device | Profile `puzzleCoins` |
| **Credits** | Reveal letters (1 credit each, or up to 2 after an ad) | Device wallet, merged to the account after sign-in | `/home/credit/balance?deviceId=` |
| **Free daily plays** | Daily-only free tier | Device counter (`ww.free_daily_plays_used`) | Same device counter |

**Puzzle credits** reveal letters. The lightbulb hint still costs **10 coins** only.

---

## How to get coins

### 1. Clear puzzle words (main score)

Each **grid word** awards coins by **letter length** from the server coin catalog. Score = sum of awards for every target word found.

### 2. Milestone level bonuses (Season Journey) | Screen type | When | Bonus coins |
| --- | --- | --- |
| **Brain Power** | Level ÷ **10** (not 100 / 1100) | **+5** |
| **Streak Sparks** | Level ÷ **100** (not 1100) | **+10** |
| **Word Master** | Level **1100** | **+0** (celebration only) |
| **Level Complete** | All other levels | **+0** |

Logged-in: server `coinsEarned` includes milestone when present. Guests: client adds `local word coins + milestone bonus`.

### 3. Bonus (treasure) words

- Real dictionary word **not** on the grid, length ≥ **3**
- **+1 coin** per unique word per puzzle (`WORD_WHEEL_BONUS_WORD_GIFT = 1`)

### 4. Daily gift

One claim per local calendar day. First day, or after a missed day: **2** coins. The next day with no gap: **3** coins. It does not climb past 3.

Guests: added to `ww.guest_puzzle_coins`.

Signed-in: `POST /home/coin/daily-gift` (JWT). Body `appCode`, `coins` (2 or 3), `claimDate` (`YYYY-MM-DD`), `streak`. Adds to `puzzleCoins.word_wheel_quest`. The same user, app, and date does not grant twice.

### 5. Shop (IAP)

Home → Shop (RevenueCat / Google Play):

| Package | Typical effect |
| --- | --- |
| **Starter Fun Bundle** | Unlocks paid daily (after free 10); grants puzzle credits |
| **Classic / Master bundles** | Coin bundles (signed-in verify) |
| **300 / 1,000 coins** | Adds puzzle coins to profile |

Non-starter packs also credit the same device wallet. Sign-in is not required.

---

## How to spend coins & credits

### Hints (in Play)

| Rule | Value |
| --- | --- |
| Cost | **10 coins** per letter (`WORD_WHEEL_HINT_COST`). Credits are not a fallback. |

### Letter reveals

| Rule | Value |
| --- | --- |
| Show 1 letter | **1 credit** for the selected word’s first still-hidden letter |
| Watch ad | Top-right chip. Wait until the balance is **+1**. Does not reveal a letter. Select a word, then the eye spends 1 credit and shows that word’s first hidden letter |
| Cell ad | Unit `Rewarded_One_Hidden_Letter` (`6505707281`). One hint-plus-ad icon on the selected word. See the rules below. The ad reveals that cell only. No SSV custom data, so the credit balance does not change |
| Completing the puzzle | Shown letters can finish a word; the completion dialog then advances the level |

Low-balance shop prompts (hints): coins &lt; **10** or credits &lt; **10** (`WORD_WHEEL_LOW_HINT_POINTS_BALANCE`, `WORD_WHEEL_LOW_CREDITS_BALANCE`).

#### When the hint-plus-ad icon shows

One icon, on one empty cell of the **selected** word. It does not grant or spend a credit.

- After **3** failed tries, and the word still has **2 or more** empty cells, the icon appears on the first empty cell.
- After **3** more fails, it moves to the next empty cell and pops.
- If the player watches the ad and that letter appears, the icon hides. The word is still unsolved. After **3** new fails, the icon shows on the next empty cell and pops.
- **1** empty cell left, or the word is solved: no icon.
- A try is a wheel submit of 3 or more letters that does not solve the selected word. The count is per word and lasts only for this visit.
- The tutorial shows the icon on one scripted cell. It does not wait for 3 misses.

---

## Quick reference — what is free?

| Content | Free allowance | Then |
| --- | --- | --- |
| Season Journey 1–1100 | **All levels** | — (no journey paywall) |
| Daily Puzzle | Free to start | — |
| Onboarding / tutorial | Always free | — |

Max journey level: **1100** (`MAX_JOURNEY_LEVEL` in `LevelScreenPolicy`).

---

## Implementation map

| Concern | Code |
| --- | --- |
| Paywall constants | `src/constants/guestAccess.js` |
| Access checks, free daily counter, credit charge | `src/lib/guestStarterPack.js` |
| Play gates & credit settle | `src/screens/PlayScreen.js` |
| Daily free-quota UI | `src/screens/DailyScreen.js` |
| Starter IAP (guest + signed-in) | `src/screens/ShopScreen.js` |
| Gate modal copy | `src/components/StarterPackGateModal.js` |
| Hint cost / bonus-word gift | `src/lib/points.js` |
| Milestone bonuses | `src/lib/LevelScreenPolicy.js` |
| Wallet (coins + account credits) | `src/hooks/useWordWheelWallet.js` |
| Credit API | `src/lib/creditApi.js` |
| IAP packages | `src/constants/store.js` |
