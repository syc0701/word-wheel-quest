# Requirement

## Upgrade the letter credit popup

Refactor the "Letter Credits" popup component to make it clearer, visually appealing, and player-friendly.

Current Issues:
- The title "Letter credits" feels technical; change it to "Need a Hint?".
- The top-right close button is missing.
- Credit count (0 credits) is plain text with no visual icon.
- Button text lacks clarity (e.g., "Buy Starter pack" doesn't specify how many credits are included).

Requirements:
1. Header:
   - Add a prominent title: "Need a Hint?"
   - Include a clear 'X' close button in the top-right corner to dismiss the modal.

2. Balance / Status Display:
   - Display current hint balance using a badge with an icon (e.g., a letter tile icon 🔤 or lightbulb 💡) and bold text: "You have X hints available".

3. Primary Action Button (In-App Purchase):
   - Styled as a prominent, eye-catching primary button with a subtle shadow or gradient.
   - Text format: "🎁 Buy Starter Pack (20 Hints)" or similar, clearly stating the hint count received.
   - Optional: Add a small "BEST VALUE" badge directly above or inside the button.

4. Secondary Action Button (Rewarded Ad):
   - Clean secondary outline button.
   - Text format: "🎬 Watch Ad (+2 Free Hints)".

5. Layout & Styling:
   - Center-align all contents with clean vertical spacing (padding: 20px–24px).
   - Rounded corners for the container card (border-radius: 16px to 20px).
   - Smooth semi-transparent backdrop blur/overlay behind the modal.

Provide the updated component code with TypeScript props, clean styling, and click event handlers for closing the modal, purchasing, and watching ads.

## Gift Box

when user visit the app we give 2 coins for gift, one time in a day.
if user visite countinous 2 days. we give 3 coins instead of 2
we have coin tables. we should recode how many coins are given.

### UI

Show Big gift box with visual effect on a popup,
Show how many coins you get

Add gift icon on main page
place the button above the shop icon.
when it is clicked open the gift what you have how many coins
how to use this.

for this we should seperate today gift coins and total coins in the play page

---

## Plan

No code yet. Two features. They must not share one wallet.

There are no customers yet, so the numbers on screen match the wallet. No display multiplier.

**Rule:** 1 credit = 1 hint = show 1 letter. The lightbulb is separate: 10 coins, not a credit.

| Word in the doc | What to show |
| --- | --- |
| "Need a Hint?" / "X hints" | The stored credit balance. 1 credit is 1 hint. |
| "Buy Starter Pack (20 Hints)" | Button text is **Buy Starter Pack (150 credits)**. Starter grants 150 letter credits. Classic grants 50. Master grants 110. These are credits that show hidden letters, not coins. |
| "Watch Ad (+2 Free Hints)" | Button text is **Watch ad (+1 credit)**. The ad adds 1 credit and stops. It does not reveal a letter. |
| Daily gift, signed in | `POST /home/coin/daily-gift` adds 2 or 3 coins to `puzzleCoins.word_wheel_quest`. Same local date does not grant twice |

### 1. Letter credit sheet

Keep the sheet inside `PlayScreen` (around the existing `creditSheetOpen` modal). Do not add a TypeScript component. This app is JavaScript. Extract a `LetterCreditSheet` only if the modal JSX gets hard to read. Handlers stay the ones already wired: close, open Shop for Starter, `handleWatchAd`.

Copy, all locales, not only English:

- Title: "Need a Hint?"
- Top-right X. Backdrop tap still closes.
- Balance row: sparkle or letter icon plus "You have {n} hints". `{n}` is the credit balance. 1 hint shows 1 letter.
- Primary button: "Buy Starter Pack (150 credits)". Optional "Best value" chip. Keep the existing gold `ShopOfferButton` look.
- Secondary outline button: "Watch ad (+1 credit)".
- Card padding 20–24, radius 16–20. Dim overlay. Skip real blur unless it is already cheap on Android; a dark scrim is enough.

Do not change the lightbulb. The ad does not reveal a letter. The player selects a word, then the eye spends 1 credit and shows that word’s first hidden letter.

### 2. Daily coin gift

Rules, unless you say otherwise:

- One claim per local calendar day.
- Streak day 1, or a missed day: **2** coins.
- Streak day 2 and every day after that, with no gap: **3** coins.
- A missed day resets the next claim to 2.

Open question: the doc only mentions 2 then 3. The plan stops there. It does not climb to 4, 5, and so on.

Storage:

- Device: last claim date, current streak, coins granted today, lifetime gift total. AsyncStorage, same style as guest coins.
- Guests: add the grant with `addGuestPuzzleCoins` so the play coin chip moves.
- Signed-in: `POST /home/coin/daily-gift` with the JWT. Body is `appCode`, `coins` (2 or 3), `claimDate` (local `YYYY-MM-DD`), and `streak`. The server adds those coins to `puzzleCoins.word_wheel_quest` and is idempotent on user + app + date. A repeat returns `alreadyClaimed` and does not add again. The response includes `coinBalance`. The app then refreshes the profile. Guests do not call this route.

UI:

- On home open, if today is unclaimed, show one modal: large chest, coin burst (reuse `CoinSparkBurst`), and the amount. Claim writes the record and closes. Do not show it again that day.
- Home: gift control **above** the shop tile. Tap opens a second view: today's gift, streak, total gift coins, and one line on use ("10 coins reveal one letter with the lightbulb").
- Play: keep the existing total coin chip. Add a small separate label for today's gift amount. Do not mix that number into the credit chip.

Order: sheet copy and layout first, then the daily gift device flow, then the signed-in coin write when the API exists.

Sections 1 and 2 are in the app. Signed-in gifts call `POST /home/coin/daily-gift`. That route still has to be added on the server. No other backend change.

---

## Stuck-word icon on an empty cell

Shipped. One hint-plus-ad icon, not one on every empty cell.

This is not the watch-ad-get-credit flow. The top-right chip and the clue-area eye stay on credits. This icon does not grant a credit and does not spend one.

### When it shows

- The player has a clue selected.
- A try is a wheel submit of 3 or more letters that does **not** solve that word.
- The count is per word, for this visit only. Leaving the puzzle resets it. Not saved, not sent to the server.
- Do not count: the correct word, a word already found, a real bonus word, a swipe shorter than 3 letters, a grid tap, the lightbulb, or the credit sheet.
- After **3** tries, if that word still has **2 or more** empty cells, show the icon on the first empty cell.
- After **3** more tries, move the icon to the next empty cell and play a pop.
- After the player watches the ad and that letter is revealed, hide the icon. If they still miss the word, wait for **3** new tries, then show the icon on the next empty cell and pop.
- **1** empty cell left, or the word is solved: no icon.
- The number badge stays. Tapping the cell still selects the word. Only the icon starts the ad.
- The tutorial shows the icon on LOG’s G without waiting for 3 misses.

### The ad on the cell

Watch an ad and show that cell. Do not open the credit sheet. Do not change the top-right credit number. Do not call the credit grant or the credit spend. Closing the ad early leaves the cell hidden and the icon up.

Ad unit `Rewarded_One_Hidden_Letter` (`ca-app-pub-1539854949018984/6505707281`). The app id stays `ca-app-pub-1539854949018984~3656372616`. This placement sends no SSV `customData`, so it does not grant a credit. The credit ad stays on `1893448351`.

### Credits, separate from the cell icon

The top-right sparkle chip is the credit control. Watching an ad from that sheet adds 1 credit and stops there. It does not reveal a letter.

The player selects a word first. The clue strip already starts on the first unsolved word. The eye shows only when the balance is at least 1. One tap spends 1 credit and shows the first still-hidden letter of that selected word, not a letter from another word.


