# Analysis — 3,000 downloads, no purchases

## Current situation

About 3,000 Play installs. No one has bought a product.

The game is two free modes plus a hint economy.

| Mode | What it is | Can you play it without paying? |
| --- | --- | --- |
| Master journey | Season levels 1–1100. Level 1100 is Word Master. Clear pays 2 coins, plus 5 every 10th level and 10 every 100th. | Yes. The journey paywall is off. Every level is free. |
| Daily puzzle | One puzzle per day, from the word-length catalog. | Yes. The “10 free, then 1 credit” gate is turned off. `resolveDailyPlayAccess` always returns free. |

A letter in a puzzle can be revealed three ways. None of them require a purchase.

| Way | Cost |
| --- | --- |
| Eye | 1 credit = 1 letter |
| Lightbulb | 10 coins = 1 letter |
| Stuck-cell ad | Watch an ad, that cell opens. No credit spent. |

Credits come from a watched ad (+1 credit, no letter until the eye is tapped) or from a pack. Coins come from clearing a level, the daily gift (2 coins, or 3 if you opened it yesterday), and bonus words (1 coin). A player who never opens the shop can finish every journey level and every daily, and can open letters with ads or with coins the game already gives them.

## What the shop sells

Five products. Credits and coins do the same job: open one letter.

| Product | Price | What the player actually gets | What the shop text says |
| --- | --- | --- | --- |
| Starter Fun Bundle | $3.99 | 150 letter credits | “extra coins”, and the success alert says extra dailies are unlocked |
| Classic Challenge | $1.99 | 50 letter credits | “conquer tough levels” |
| Master Quest | $2.99 | 110 letter credits | “ultimate stash” — this is not the Master journey |
| 300 coins | $0.99 | 30 lightbulb hints | 300 coins |
| 1,000 coins | $2.49 | 100 lightbulb hints | 1,000 coins |

Starter is the button on the hint sheet and is labeled best value. Per letter it is about the same price as the 1,000-coin pack. Classic is the worst deal: fewer credits per dollar than Starter, and a higher price than a coin pack that opens more letters.

## What is missing

There is no moment where paying is the way to keep playing.

- Journey is free through Word Master. Buying “Master Quest” does not unlock it.
- Daily never stops. The screen still counts down 10 free plays and then talks about credits, but play is not blocked.
- An ad replaces every pack. One video is one letter, with no daily cap.
- Coins earned by playing also replace the coin packs. A few clears pay for a lightbulb.
- The pack names and descriptions do not say “150 letters”. Starter still talks about coins and unlocking dailies, which is not what the purchase does.

Zero purchases matches this setup. Installs are not players who hit a locked level. The people who do play can finish the game and open letters without the shop.

## What we can do

The journey people already play stays as it is: levels 1–1100, free. These are other things we can add beside it.

### Packs of puzzles

New packs, separate from the journey. A pack is a set of puzzles with a count, a word length, and a price. Buying one does not change the journey and does not grant letter credits.

| Pack | Puzzles | Words | Price |
| --- | --- | --- | --- |
| Pack A | 100 | 4–8 letters | $2 |

More packs can follow the same shape: a different count, a different letter range, or a theme. The button says how many puzzles are in the pack.

### An ad every 10 levels, and a $2 remove-ads product

On the journey, an ad plays every 10 levels, when that level is cleared. The banner stays on Play and Daily.

One new product, $2, removes both: the banner, and that every-10-levels complete ad.

### Daily after 10 costs a credit

The first 10 daily puzzles stay free. From the 11th on, starting a daily costs a credit.

A watched ad grants coins, not credits. Coins still open a letter with the lightbulb (10 coins). They do not start the next daily. The credit for that daily comes from a pack.
