# Reveal credits + watch-ad reward

Plan only. No code changes yet.

## What the code does today

Credits and coins are different wallets.

| Currency | How you get it | How you spend it |
| --- | --- | --- |
| **Puzzle coins** | Solving words, milestones, coin packs (300 / 1,000) | Hint: **10 coins** reveal one letter |
| **Credits** | Shop bundles (server amounts below). Guest Starter also stores **50** locally | Hint fallback: **10 credits** reveal one letter (signed-in only). Extra daily: **1 credit** to start a puzzle after 10 free plays |

Journey is already free. Starter / Classic / Master do **not** charge a credit to start a journey level.

Server grants on purchase (`puzzle-be` `appleWordWheelQuest`):

| Pack | Play product | Credits granted |
| --- | --- | --- |
| Starter Fun Bundle | `word_wheel_pack_starter` | **150** |
| Classic Challenge | `word_wheel_pack_medium` | **50** |
| Master Quest | `word_wheel_pack_hard` | **110** |
| 300 / 1,000 coins | `word_wheel_coins_*` | coins, not reveal credits |

Play page already shows a **coin** chip (`GiTwoCoins` + count) and a hint button. There is no credit chip and no rewarded ad. Only a banner unit exists in `src/constants/ads.js`.

A +2 ad reward cannot reveal a letter under the current rule (a letter costs 10 credits). That cost has to change.

## What we are changing

Credits become a **letter-reveal** currency. They are no longer spent to start a puzzle.

| Rule | New value |
| --- | --- |
| Watch ad | Server grants **2 credits** only after AdMob’s callback. Then reveal up to 2 letters |
| Show 1 letter | Clue-area button. **1 credit** reveals 1 letter. Leftover and purchased credits both work |
| Order | All **1st** letters, then all **2nd**, then **3rd**, and so on |
| More ads | Allowed. An ad can finish the puzzle |
| Leftover | Last hidden letter uses 1 of the 2. Puzzle completes, word is shown, then next level. **1 credit** stays |
| Who | Guests and signed-in players, one wallet per `deviceId` |
| Play | Free. No credit to start a puzzle. Journey stays free. Daily after 10 stays free |
| Coin hint (lightbulb) | Unchanged: **10 coins** still reveal one letter |
| 10-credit hint fallback | Remove it |

Buying Starter / Classic / Master still adds credits (same server amounts). Those credits are for reveals, not for unlocking play.

## Show 1 letter (clue area)

Add a **Use credit / Show 1 letter** button on the clue card for the selected word.

Tap it when the balance is at least 1 (leftover from an ad, or credits from Starter / Classic / Master). Spend **1 credit** and reveal the selected word’s first still-hidden letter. If that letter is already visible, reveal the next hidden letter of that word. Same order as the ad when no word is selected: 1st letters, then 2nd, then 3rd.

If the balance is 0, do not reveal. Open the credit sheet (buy, then watch ad).

Purchased credits are not auto-applied. Only this button spends them, one letter at a time.

## After a watched ad

Do not reveal when the video ends. Wait until the server has granted the 2 credits from AdMob’s callback. If that grant never arrives, reveal nothing.

When the grant is in the balance, reveal up to **2 letters** now. Use `findHintLetterCandidates` with no selected-word preference. Skip letters already visible. Play `mixkit-retro-game-notification-212.wav`. Then consume 1 credit per letter actually shown.

The player may watch another ad. The next one continues the same queue.

If only 1 hidden letter is left:

- The callback still grants **2 credits**.
- Reveal that last letter. The puzzle is solved.
- Show the completed word to the player.
- Then go to the next level.
- The unused credit stays on the balance for the next puzzle. The player spends it with Show 1 letter, or it is used by the next ad’s reveal.

A watched ad may finish the puzzle. Letters appear, the word is shown, then the level advances. Do not skip the word.

## Play page

Add a credit chip next to the existing coin chip: credit icon + number.

Tap the chip. It opens a sheet, in this order:

1. Current credit count (includes leftovers kept for next use).
2. **Buy** — Starter Fun Bundle first. On a successful purchase, play `mixkit-ethereal-fairy-win-sound-2019.wav` and a short visual (same idea as the coin spark already on the play page). Other packs stay in Shop.
3. **Watch ad** — last. A finished video does not reveal by itself. Letters appear only after the server grant from AdMob’s callback.

Audio files (already in the repo):

- `src/assets/audio-effect/mixkit-ethereal-fairy-win-sound-2019.wav` — purchase success
- `src/assets/audio-effect/mixkit-retro-game-notification-212.wav` — ad reward credited

## Ad unit

Already created in AdMob. Not wired in the app yet.

| | |
| --- | --- |
| App ID | `ca-app-pub-1539854949018984~3656372616` (already in `app.json` / `src/constants/ads.js`) |
| Rewarded unit | `Rewarded_Show_Hidden_Letters` `ca-app-pub-1539854949018984/1893448351` |

Dev builds must use Google’s test rewarded id, same as the banner does, so we do not burn the live unit.

Jigsaw’s rewarded unit is `ca-app-pub-1539854949018984/5398399930`. Word Wheel uses its own unit. Same callback URL.

## APIs — reuse Jigsaw, no new endpoint

Checked `puzzle-serverless` and `puzzle-be`. Jigsaw already does watch-ad credits. Word Wheel uses those routes with `appCode: word_wheel_quest`. Do not add a new grant or consume API.

### 1. SSV callback (serverless) — verify only

`GET https://j5h8ww2tl9.execute-api.us-east-1.amazonaws.com/prod/admob-ssv`

Paste that into AdMob → `Rewarded_Show_Hidden_Letters` → Callback URL. Same URL Jigsaw uses.

`functions/admob-ssv/handler.js` verifies Google’s signature and returns 200 to AdMob. Today it only stores the row in `mo_admob_ssv`. Word Wheel’s grant is added on that same callback, only for unit `1893448351`. Jigsaw’s unit stays log-only so Jigsaw is not granted twice.

Allowlist today is the Jigsaw suffix `5398399930` plus one extra unit from env `ADMOB_REWARDED_AD_UNIT_ID`. An unknown `ad_unit` is only logged; the callback is still accepted. Still set the env to `ca-app-pub-1539854949018984/1893448351` so Word Wheel is expected. Jigsaw stays allowed because `5398399930` is hardcoded. If a third unit is needed later, change that env to a comma-separated list — that is the only serverless parameter to add. No new path.

SSV options on the rewarded ad, same as Jigsaw `AdMobService.showRewardedAd`:

- `userId` — signed-in cloud user id, omit for guests
- `customData` — install / device id

### 2. Grant — AdMob callback, not the app

Reward amount is **2**. Set that on the AdMob unit. The server also sends `rewardAmount: 2`.

After a verified callback for `1893448351`, grant **2 credits to the device wallet**. AdMob calls our URL and does not send the app login token. That is fine: `custom_data` is the `deviceId`, and the grant can credit that device with no login. Do not grant from `user_id` on this callback.

`POST /home/credit/ad-reward`

| Field | Value |
| --- | --- |
| `appCode` | `word_wheel_quest` |
| `eventId` | AdMob `transaction_id` (repeat callback does not grant again) |
| `rewardAmount` | `2` |
| `deviceId` | AdMob `custom_data` (install id the app set before the video) |

The app does not call this route. If the callback never arrives, no credits and no letters.

Poll `GET /home/credit/balance?appCode=word_wheel_quest&deviceId=…` until that device balance is 2 higher, then reveal. After sign-in, `guest/merge` moves that device balance onto the account, and the app shows the account balance.

### 2b. Shop products also use `deviceId`

There are no paid players yet. Starter, Classic, Master, and the coin packs must credit the same device wallet, not a local 50 and not a signed-in-only wallet.

`POST /home/credit/iap/verify` today rejects a missing login and writes `mo_user_credits` only. Add optional `deviceId` on that same route. No login: grant the product’s credits to `mo_guest_credits` for that device. Stop writing `ww.guest_puzzle_credits`. Create a stable install `deviceId` (Word Wheel has none today) and send it on verify, consume, balance, and ad SSV `custom_data`.

### 3. Spend the letters that were shown — existing consume

`POST /home/credit/consume`

Already used by Word Wheel hints (`featureUsed` like `word_wheel_hint:{playId}:{timestamp}`, `creditsConsumed` 10).

For this feature, call it only for letters actually revealed:

| Field | Value |
| --- | --- |
| `appCode` | `word_wheel_quest` |
| `featureUsed` | `word_wheel_letter:{playId}:{row},{col}` — unique per cell, so it is not a once-per-puzzle unlock. Unlock idempotency applies only to `jigsaw_muse` / `sliding_puzzle_quest` / `web_app` UUID keys |
| `creditsConsumed` | `1` per letter shown (or `2` in one call if both landed) |
| `deviceId` | Required when there is no JWT. The parameter already exists for guests. Word Wheel’s `CreditApi.consumeCredits` does not send it today — pass it, same as Jigsaw |

Do **not** consume a letter that was not revealed. The unused half of the +2 stays in `creditBalance`. That is the “keep 1 credit for next use”. No new leftover field.

The unused credit stays in that same balance. It is not applied by itself on the next puzzle. The player spends it with Show 1 letter, or the next ad’s reveal consumes it after the new grant. A 150-credit Starter pack is spent the same way: one letter per tap.

### 4. Sign-in merge — existing

`POST /home/credit/guest/merge` with `appCode: word_wheel_quest` and `deviceId`. Jigsaw calls this after sign-in so guest ad credits move to the account. Use the same. No new path.

### What not to add

No new serverless path. No new puzzle-be path. `appCode` and `deviceId` already select the wallet. The only config change is allowing ad unit `1893448351` on the existing SSV function.

## Decided

- Show 1 letter spends leftover and purchased credits. One tap, one letter.
- Starter and the other packs grant to the device wallet. No paid players yet, so drop the local guest 50.
- Puzzles are free to play. Do not charge a credit to start a daily after the free 10. Remove that gate copy.
- Credits are granted only when AdMob’s callback reaches the server. No letters if that fails.
- Reward amount is 2. One letter left still grants 2: show the word, go to the next level, keep 1.
- An ad can complete the puzzle. Reveal the letters, show the word, then advance.
## Tech notes

Both decided. No open tech issues.

- **AdMob callback grant.** Update `admobSsvPersist`. For unit `1893448351`, write **2 credits** to the device wallet (`custom_data` = `deviceId`): `mo_ad_reward_events` and `mo_guest_credits`. Use AdMob `transaction_id` so a repeat callback does not grant again. Do not call the public app route from that Lambda.
- **Shop purchase row.** No paid players yet. Make `mo_iap_transactions.user_id` optional and store `deviceId`. Credits still land on `mo_guest_credits`. After sign-in, merge moves them to the account.

- AdMob callback grants the device wallet only. No login token on that call. After sign-in, merge, then the app shows the account balance.
- Test on a real device with the live rewarded unit. No debug bypass.

## Not in this change

- No new Play product. Starter is the buy button on the sheet.
- Coin packs and the 10-coin hint stay as they are.
- Shop billing failure (“not available on this device”) is a separate Play Store / emulator issue. The sheet still has to handle a failed purchase.
