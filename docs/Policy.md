# Word Wheel Quest — Credits, Coins & Bonuses

How the app manages **puzzle coins**, **credits**, spending (hints), and bonus rewards. Values below match the current client (`src/lib/points.js`, `src/hooks/useWordWheelWallet.js`, `src/lib/LevelScreenPolicy.js`).

---

## Two balances

| Balance | What it is | Where it lives |
| --- | --- | --- |
| **Puzzle coins** | Primary earned / purchased currency for Word Wheel Quest | User profile (`puzzleCoins` → “Word Wheel Quest” coins). Shown in Settings → Your balance and on the Play HUD. |
| **Credits** | Shared account currency (fallback when coins run out) | `/home/credit/balance` via `CreditApi`. Consumed with `/home/credit/consume`. |

**Spend order for hints:** puzzle coins first, then credits.

```
available for hints = puzzle coins remaining + credit balance
```

Guests (not signed in) only track a **session** coin pool for the current play; credits require sign-in.

Constants:

- Low-balance shop prompts: coins &lt; **10** or credits &lt; **10** (`WORD_WHEEL_LOW_HINT_POINTS_BALANCE`, `WORD_WHEEL_LOW_CREDITS_BALANCE`).

---

## How to get coins

### 1. Clear puzzle words (main score)

Each **grid word** you find awards coins by **letter length**, from the server coin catalog (Settings / points table). Puzzle score is the sum of those awards for every target word found.

### 2. Milestone level bonuses (Season Journey)

On journey level complete, extra coins may be added:

| Screen type | When | Bonus coins |
| --- | --- | --- |
| **Brain Power** | Level is a multiple of **10** (but not 100 / 1100) | **+5** |
| **Streak Sparks** | Level is a multiple of **100** (but not 1100) | **+10** |
| **Word Master** | Level **1100** | **+0** (celebration only) |
| **Level Complete** | All other levels | **+0** |

Source: `LevelScreenPolicy` / `MILESTONE_BONUS_COINS`.

Logged-in players: server `coinsEarned` already includes the milestone when present. Guests: client adds `local word coins + milestone bonus`.

### 3. Bonus (treasure) words

Spell a **real dictionary word** that is **not** one of this puzzle’s target words:

- Length ≥ **3**
- In the dictionary for the puzzle language
- Not on the banned list
- **+1 coin** per **unique** word (`WORD_WHEEL_BONUS_WORD_GIFT = 1`)
- Same word again in that puzzle: no second gift
- Shown in the treasure-chest list for the puzzle

### 4. Shop (IAP)

Home → Shop (RevenueCat / Google Play). Packages add coins to the player balance (bundles + fixed packs such as **300** and **1,000** coins). Purchases are verified with the credit/IAP backend.

---

## How to use coins (and credits)

### Hints (only spend path in Play)

| Rule | Value |
| --- | --- |
| Cost | **10** coins **or** credits per letter (`WORD_WHEEL_HINT_COST`) |
| Effect | Reveals one empty letter on the grid (preferred: next letter in the selected word) |
| Order | Prefer **puzzle coins**; if fewer than 10 coins remain, spend **credits** (signed-in only) |
| Auto-complete | If hints (+ crossings) fully reveal a target word, that word is counted as found |

Not enough balance → alert with option to open the Shop.

Hints used are tracked as `hintCoinsSpent` on the completion dialog (display only; they do not reduce the puzzle word-score total shown as “max score”).

---

## Bonus summary

| Bonus | Amount | Trigger |
| --- | --- | --- |
| Treasure / off-grid word | **+1** coin | Valid dictionary word not on the grid; once per unique word per puzzle |
| Brain Power milestone | **+5** coins | Journey level ÷ 10 (not ÷ 100 / 1100) |
| Streak Sparks milestone | **+10** coins | Journey level ÷ 100 (not 1100) |
| Word Master | — | Level 1100 celebration |

---

## Related unlock (not currency)

**Daily Puzzle** unlocks at Season Journey **level 50** (`WORD_WHEEL_DAILY_UNLOCK_LEVEL`). It is a separate play mode, not a coin grant by itself.

---

## Implementation map

| Concern | Code |
| --- | --- |
| Hint cost / bonus-word gift | `src/lib/points.js` |
| Milestone bonuses | `src/lib/LevelScreenPolicy.js` |
| Wallet (coins + credits) | `src/hooks/useWordWheelWallet.js` |
| Credit API | `src/lib/creditApi.js` |
| Bonus-word validation | `src/lib/dictionary.js` → `validateBonusWord` |
| Spend / gift UX | `src/screens/PlayScreen.js` |
| IAP packages | `src/constants/store.js` |
