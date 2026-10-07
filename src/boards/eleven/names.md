# Eleven board — space naming (preview)

Three **derived** schemes for the same 68 spaces (`topology.json` indices `0`–`67`).
None of these are canonical yet; pick one (or a subset) for gameslib / move notation.

Regenerate: `node scripts/generate-eleven-space-names.mjs`

## A — Stable (`e01`…`e68`)

- Sort order: geography `(y, x)` — same as topology index.
- `e` + two-digit **1-based** index (`e01` = index `0`).
- Best for: logs, tests, compact storage, no board orientation.

## B — Pitch-oriented

- **Half:** `W` / `E` from midfield line (`midline` marker); center-band uses `c-` prefix.
- **Band:** `G` goal, `P` penalty, `C` center circle, `F` open field, `K` kick-off (alone).
- **Index:** clockwise sweep within each band from a band anchor (goal mouth, center, etc.).
- Examples: `W-F-03`, `E-P-2`, `c-C-04`, `K`.

## C — Rules-inspired (not official notation)

- Labels derived from rule **concepts** on the [Spielstein 11 rules](https://spielstein.com/games/11/rules) page
  (e.g. “kick-off space”, “goal space”, “penalty area”, “7 dark spaces”) — that page has **no** coordinate or space IDs.
- Scheme C maps those ideas to ids: `kickoff`, `goal-W|E-n`, `center-1`…`7`, `penalty-W|E-n`,
  `score-W|E-n` (three shoot-from spaces per end — nearest to goal line inside penalty),
  `field-W|E-nn` elsewhere on that half.
- Orientation: **W** = left goal on the board art, **E** = right (defending ends).

## Comparison

| Index | Stable | Pitch | Rules-inspired |
|------:|--------|-------|----------|
| 0 | e01 | E-F-01 | field-E-01 |
| 1 | e02 | W-F-01 | field-W-01 |
| 2 | e03 | E-F-02 | field-E-02 |
| 3 | e04 | W-F-02 | field-W-02 |
| 4 | e05 | E-F-03 | field-E-03 |
| 5 | e06 | W-F-03 | field-W-03 |
| 6 | e07 | W-F-04 | field-W-04 |
| 7 | e08 | E-F-04 | field-E-04 |
| 8 | e09 | E-F-05 | field-E-05 |
| 9 | e10 | W-F-05 | field-W-05 |
| 10 | e11 | E-F-06 | field-E-06 |
| 11 | e12 | W-F-06 | field-W-06 |
| 12 | e13 | W-F-07 | field-W-07 |
| 13 | e14 | E-F-07 | field-E-07 |
| 14 | e15 | E-F-08 | field-E-08 |
| 15 | e16 | E-F-09 | field-E-09 |
| 16 | e17 | W-F-08 | field-W-08 |
| 17 | e18 | W-F-09 | field-W-09 |
| 18 | e19 | W-F-10 | field-W-10 |
| 19 | e20 | W-P-01 | score-W-1 |
| 20 | e21 | E-P-01 | score-E-1 |
| 21 | e22 | E-F-10 | field-E-10 |
| 22 | e23 | W-F-11 | field-W-11 |
| 23 | e24 | W-F-12 | field-W-12 |
| 24 | e25 | c-C-01 | center-1 |
| 25 | e26 | c-C-02 | center-6 |
| 26 | e27 | E-F-11 | field-E-11 |
| 27 | e28 | E-F-12 | field-E-12 |
| 28 | e29 | c-C-03 | center-5 |
| 29 | e30 | W-F-13 | field-W-13 |
| 30 | e31 | W-F-14 | field-W-14 |
| 31 | e32 | W-G-01 | goal-W-1 |
| 32 | e33 | E-G-01 | goal-E-1 |
| 33 | e34 | E-P-02 | score-E-2 |
| 34 | e35 | W-P-02 | score-W-2 |
| 35 | e36 | K | kickoff |
| 36 | e37 | c-C-04 | center-2 |
| 37 | e38 | E-F-13 | field-E-13 |
| 38 | e39 | c-C-05 | center-4 |
| 39 | e40 | c-C-06 | center-3 |
| 40 | e41 | W-F-15 | field-W-15 |
| 41 | e42 | E-F-14 | field-E-14 |
| 42 | e43 | W-F-16 | field-W-16 |
| 43 | e44 | W-P-03 | score-W-3 |
| 44 | e45 | E-P-03 | score-E-3 |
| 45 | e46 | E-F-15 | field-E-15 |
| 46 | e47 | E-F-16 | field-E-16 |
| 47 | e48 | W-F-17 | field-W-17 |
| 48 | e49 | E-F-17 | field-E-17 |
| 49 | e50 | W-F-18 | field-W-18 |
| 50 | e51 | E-F-18 | field-E-18 |
| 51 | e52 | W-F-19 | field-W-19 |
| 52 | e53 | W-F-20 | field-W-20 |
| 53 | e54 | W-F-21 | field-W-21 |
| 54 | e55 | E-F-19 | field-E-19 |
| 55 | e56 | E-F-20 | field-E-20 |
| 56 | e57 | E-F-21 | field-E-21 |
| 57 | e58 | E-F-22 | field-E-22 |
| 58 | e59 | W-F-22 | field-W-22 |
| 59 | e60 | W-F-23 | field-W-23 |
| 60 | e61 | W-F-24 | field-W-24 |
| 61 | e62 | E-F-23 | field-E-23 |
| 62 | e63 | E-F-24 | field-E-24 |
| 63 | e64 | W-F-25 | field-W-25 |
| 64 | e65 | W-F-26 | field-W-26 |

Machine-readable: [`space-names.json`](space-names.json).
