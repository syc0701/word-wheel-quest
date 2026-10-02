# Daily page: grid preview + title/difficulty

On the Daily Puzzle screen, remove the month calendar and show a non-interactive puzzle grid preview instead, with the puzzle title and difficulty in place of the “N words · NxN grid” meta line. Keep the existing day prev/next date controls.

## Scope

Update `src/screens/DailyScreen.js` only (Android app). Day browsing stays via the existing chevron date row; the month calendar card is removed.

## UI changes

1. Remove the month calendar block (`monthLabel`, weekday row, `daysGrid` / `buildMonthDays` / `WEEKDAY_KEYS` and related styles).
2. In the preview card (replacing current `daily.meta` copy):
   - Show title from `puzzle.title` (trimmed).
   - Show difficulty from `puzzle.difficultyLevel` via the same simple formatter iOS already uses: capitalize enum string (e.g. `EASY` → `Easy`).
   - Keep the existing Completed chip when `puzzle.completed`.
   - Render a read-only `PuzzleGrid` built from the daily payload the same way Play does:
     - `parseWordPositions(puzzle.filledCoordinates)` → `puzzleCellKeys`
     - `buildCellWordNumbers(puzzle.filledCoordinates, …)` for clue numbers
     - `buildDisplayGrid([], wordPositions, {}, gridSize)` so letters stay hidden (shape + numbers only — no spoilers)
     - Empty sets for selection / hints / celebrate; no `onCellPress`
3. Loading / error / empty states stay as today (spinner or `daily.empty` / error text).

## Layout sketch

```
[ ← date → ]          // keep
[ title ]
[ difficulty chip ]
[ PuzzleGrid preview ] // replaces calendar
[ Play / Replay ]
```

## Cleanup

- Drop unused imports/helpers (`parseWords` for meta count if unused, calendar builders, weekday constants).
- Leave `daily.meta` locale strings unused for now (no mass locale edits required).
- No API changes: daily endpoint already returns `title`, `difficultyLevel`, `filledCoordinates`, `completed`.

## Default decisions
- Calendar: fully removed (not moved elsewhere).
- Grid: empty silhouette with word numbers, not a solved board.
- Difficulty: display-formatted enum name (same as iOS DailyScreen `formatDifficulty`).
