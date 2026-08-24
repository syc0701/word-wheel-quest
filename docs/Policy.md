# Word Wheel Quest — Paywalls, Credits, Coins & Bonuses

How the app gates content, manages **puzzle credits**, **puzzle coins**, spending (hints), and bonus rewards. Values match the current client (`src/constants/guestAccess.js`, `src/lib/guestStarterPack.js`, `src/lib/points.js`, `src/hooks/useWordWheelWallet.js`).

---

## Paywalls & access (all users)

These rules apply to **guests and signed-in players**. Sign-in does **not** bypass the starter pack or journey level cap.

Constants (`src/constants/guestAccess.js`):

| Constant | Value | Meaning |
| --- | --- | --- |
| `GUEST_MAX_LEVEL_WITHOUT_STARTER` | **50** | Last free Season Journey level |
| `GUEST_STARTER_UNLOCK_LEVEL` | **51** | First level that needs Starter Fun Bundle |
| `FREE_DAILY_PLAYS` | **10** | Daily puzzles playable without starter/credits |
| `STARTER_PACK_PUZZLE_CREDITS` | **50** | Credits bundled with starter (guest local grant) |
| `PUZZLE_PLAY_CREDIT_COST` | **1** | Credits spent to **start** one gated puzzle |

Product: **Starter Fun Bundle** (`bundle_starter` / `word_wheel_pack_starter`) in Shop.

### Season Journey

| Levels | Cost |
| --- | --- |
| **1–50** | Free — no starter pack, no puzzle credits |
| **51–1100** | Requires **Starter Fun Bundle** **and** **1 puzzle credit** per level started |

After completing level **50**, the app shows the starter upsell. Level **51+** is blocked until the pack is owned **and** the player has credits remaining.

Replay of an already-unlocked journey level still consumes **1 credit** when the play session starts (same as a new level).

### Daily Puzzle

| Rule | Detail |
| --- | --- |
| Level gate | **None** — Daily is available from Home without reaching level 50 |
| Free quota | **10** daily play starts per device (any calendar date in the archive) |
| After free quota | Requires **Starter Fun Bundle** **and** **1 puzzle credit** per daily play started |
| Calendar browse | Full date picker; only **starting** a play is gated |

Each time a daily puzzle **starts** (`WordWheelApi.startPlay`), the client either increments the free-play counter or consumes **1 puzzle credit**.

### Starter Fun Bundle purchase

| Player | What happens |
| --- | --- |
| **Signed in** | Google Play purchase → `CreditApi.verifyIapPurchase` → **server credit balance** increases (amount from backend). Local “starter owned” flag is set. |
| **Guest** | Purchase stored locally + **50 puzzle credits** on device (`ww.guest_puzzle_credits`). Pending receipt saved for sync on later sign-in. **No sign-in required** to continue playing. |

When a guest later signs in, `verifyPendingIapIfNeeded` attaches the purchase to the account.

### Gate modals

| Situation | User sees |
| --- | --- |
| Journey 51+ without starter | Starter Fun Bundle upsell |
| Daily after 10 free plays, no starter | Starter Fun Bundle upsell |
| Starter owned, **0 puzzle credits** | Out-of-credits → Shop |

Implementation: `StarterPackGateModal`, `src/screens/PlayScreen.js`, `src/screens/DailyScreen.js`, `src/screens/ShopScreen.js`.

---

## Three “balances” (don’t confuse them)

| Balance | Purpose | Guest | Signed-in |
| --- | --- | --- | --- |
| **Puzzle coins** | Earned per word; spent on **hints** in Play | Session pool on device | Profile `puzzleCoins` |
| **Credits (account)** | **Hints** (fallback) **and** **gated puzzle starts** | Local puzzle-credit pool after guest starter purchase | `/home/credit/balance` |
| **Free daily plays** | Daily-only free tier | Device counter (`ww.free_daily_plays_used`) | Same device counter |

**Puzzle credits** (for level 51+ / daily after free quota) and **hint credits** (account `/home/credit/consume`) share the same signed-in **credit balance** on the server. On guest, starter grants a **separate local puzzle-credit pool** used only for gated puzzle starts.

---

## How to get coins

### 1. Clear puzzle words (main score)

Each **grid word** awards coins by **letter length** from the server coin catalog. Score = sum of awards for every target word found.

### 2. Milestone level bonuses (Season Journey)

| Screen type | When | Bonus coins |
| --- | --- | --- |
| **Brain Power** | Level ÷ **10** (not 100 / 1100) | **+5** |
| **Streak Sparks** | Level ÷ **100** (not 1100) | **+10** |
| **Word Master** | Level **1100** | **+0** (celebration only) |
| **Level Complete** | All other levels | **+0** |

Logged-in: server `coinsEarned` includes milestone when present. Guests: client adds `local word coins + milestone bonus`.

### 3. Bonus (treasure) words

- Real dictionary word **not** on the grid, length ≥ **3**
- **+1 coin** per unique word per puzzle (`WORD_WHEEL_BONUS_WORD_GIFT = 1`)

### 4. Shop (IAP)

Home → Shop (RevenueCat / Google Play):

| Package | Typical effect |
| --- | --- |
| **Starter Fun Bundle** | Unlocks journey 51+ / paid daily; grants puzzle credits |
| **Classic / Master bundles** | Coin bundles (signed-in verify) |
| **300 / 1,000 coins** | Adds puzzle coins to profile |

Non-starter guest purchases still require sign-in to verify; starter pack is the exception.

---

## How to spend coins & credits

### Hints (in Play)

| Rule | Value |
| --- | --- |
| Cost | **10** coins **or** credits per letter (`WORD_WHEEL_HINT_COST`) |
| Order | Puzzle coins first, then **account credits** (signed-in only) |
| Guests | Puzzle coins in session only; no account credit hints unless signed in |

### Gated puzzle starts

| Rule | Value |
| --- | --- |
| Cost | **1 puzzle credit** per journey 51+ or daily (after free 10) |
| When charged | On successful `startPlay`, via `settlePuzzlePlayCharge` |
| Signed-in | `CreditApi.consumeCredits` (`featureUsed`: `word_wheel_journey:*` or `word_wheel_daily:*`) |
| Guest | Local `consumeGuestPuzzleCredits` |

Low-balance shop prompts (hints): coins &lt; **10** or credits &lt; **10** (`WORD_WHEEL_LOW_HINT_POINTS_BALANCE`, `WORD_WHEEL_LOW_CREDITS_BALANCE`).

---

## Quick reference — what is free?

| Content | Free allowance | Then |
| --- | --- | --- |
| Season Journey 1–50 | All levels | Starter pack + 1 credit/level |
| Season Journey 51–1100 | — | Starter pack + 1 credit/level |
| Daily Puzzle | **10** play starts | Starter pack + 1 credit/play |
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
