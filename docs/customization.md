# User customization (board chrome)

Abstract Play stores per-user renderer overrides in the front-end profile under **`customizations[metaGame].render`**. The renderer package implements merge, validation, and sanitization so the site does not duplicate board rules.

## Contract

| Client field | Renderer API | Effect |
|--------------|--------------|--------|
| `render.board` | `applyBoardChrome(rep, boardChrome)` | Shallow merge of allowlisted `boardBasic` keys onto the game’s render rep |
| `render.options` | Same call: `{ ...board, options }` | Replaces `rep.options` when present |
| `render.glyphmap` | Renderer `options.glyphmap` (not rep merge) | Legend glyph id + scale at draw time |

Entry points exported from `@abstractplay/renderer`:

- `applyBoardChrome`, `sanitizeRenderRep`, `validateRenderCustomization`
- `getCompatibleStyles`, `isBoardChromeEligible`
- Registry: `src/boardChrome/registry.ts`

## Eligibility

`isBoardChromeEligible(rep)` is true for standard row/column grid boards with string `pieces` (see `piecesShape.ts`). Hex-only and special topologies return false for **style** overrides; **rep options** (e.g. `hide-labels`) still merge when the front passes them.

## Style compatibility

`getCompatibleStyles(currentStyle)` lists swappable `board.style` values within the same registry group. Cross-group changes (e.g. `squares-stacked` → `vertex`) fail `validateRenderCustomization`.

`squares-diamonds` is not user-swappable via customization.

## Board fields (allowlist)

Includes `style`, `strokeWeight`, `labelScale`, `labelColour`, `labelOpacity`, strokes, `backFill`, `markers`, `rotate`, tile flags, `blocked`, etc.

**Denied** in user chrome: `width`, `height`, and other dimension keys that would break game logic.

## `labelScale`

Optional number on `boardBasic` (default `1`). Row/column coordinate labels under `#labels` use:

`baseFontSize × labelScale` (base is topology-specific; many rect grids use a fixed px default, hex rects use `cellsize / 5`).

## Markers

- Omitted in `render.board` → keep game markers; live sanitize may drop unsupported types.
- Present (including `[]`) → **replace** `board.markers`.

## Live play

Front passes `sanitizeMode: 'live'` so unsupported markers (e.g. `flood` after a style change) are stripped instead of throwing.

## Related

- [Boards](/renderer/boards/) — topology reference
- [Glyphs](/renderer/glyphs/) — glyph ids and glyphmap tuples
- [Front Customize & themes](/front/subsystems/customize/) — UI, bulk apply, legacy `glyphmap`
