# Glyphs

The `legend` maps keys used in `pieces` to visual definitions. Each entry is either a **sheet piece name** (like `piece` or `meeple`), a **glyph object** with transforms and colours, or an **array of glyph objects** composited into one piece.

Player-owned pieces should set `colour` to a player number (`1`, `2`, …) so user colour settings apply. Use hex colours or colour functions only when the colour is fixed.

See the [contact sheet](/renderer/contact-sheet/) for every available sheet piece name.

## Simple glyphs

A legend entry can be a plain string (the sheet piece name) or an object with `name` and optional properties:

```json
"P1": { "name": "piece", "colour": 1 }
```

*Example games:* [Arimaa](https://play.abstractplay.com/games/arimaa), [Go](https://play.abstractplay.com/games/go)

{% renderWidget "samples/pieces-simple.json" %}

## Composite glyphs

An array of glyph objects is drawn **bottom to top** — the first entry sits underneath later ones. Each layer can have its own `name`, `colour`, `scale`, `rotate`, and other properties. Layers without a `colour` keep the artwork from the sheet.

*Example games:* [Alfred's Wyke](https://play.abstractplay.com/games/wyke), [Cannon](https://play.abstractplay.com/games/cannon)

{% renderWidget "samples/pieces-layered.json" %}

## Gradients

`colour` and `colour2` accept linear gradients with `stops` and optional `x1`/`y1`/`x2`/`y2` (0–1, relative to the glyph bounds).

{% renderWidget "samples/pieces-gradients.json" %}

## Colour functions

Colours throughout render JSON (glyphs, markers, board fills, and more) can use **colour functions** instead of a literal hex value or player number.

| Function | Purpose |
| --- | --- |
| `flatten` | Blend a semi-transparent foreground over a background into one opaque colour. |
| `lighten` | Lighten or darken a base colour by saturation (`ds`) and luminance (`dl`) deltas. |
| `bestContrast` | Pick the most readable colour from a list against a given background. |
| `custom` | Use a game-specific default while still respecting player or context customizations. |

### `flatten`

Returns the fully opaque colour equivalent to painting `fg` at `opacity` over `bg`.

```json
{
  "func": "flatten",
  "fg": "_context_fill",
  "bg": "_context_background",
  "opacity": 0.25
}
```

### `lighten`

Adjusts saturation and luminance. Positive `ds`/`dl` lighten; negative values darken. Arguments can themselves be player numbers, hex strings, context tokens, or nested functions.

```json
{
  "func": "lighten",
  "colour": 3,
  "ds": 3,
  "dl": 1
}
```

### `bestContrast`

Chooses the entry from `fg` with the best contrast against `bg`.

```json
{
  "func": "bestContrast",
  "bg": "_context_background",
  "fg": ["#000", "#fff"]
}
```

### `custom`

Ties a `default` colour to a `palette` value (player number or `_context_*` token). The renderer uses `default` when the user has not customized that palette slot; otherwise it uses `palette`. Set `paletteType` to `"player"` or `"context"` when `palette` is itself a function.

{% renderWidget "samples/niche-functions.json" %}

### Colour value types

Any colour property accepts one of:

| Form | Example | Notes |
| --- | --- | --- |
| Player number | `1` | Uses the user's colour for that player (or pattern, if enabled). |
| Hex string | `"#ff6633"` | Fixed colour. |
| Context token | `"_context_strokes"` | Resolved from the active colour context (`strokes`, `fill`, `background`, `borders`, `labels`, `annotations`, `board`). |
| Gradient | `{ "stops": […] }` | Linear gradient; see Gradients above. |
| Colour function | `{ "func": "lighten", … }` | See table above. |

## Rotated glyphs

{% renderWidget "samples/pieces-rotated.json" %}

*Example games:* [Crosshairs](https://play.abstractplay.com/games/crosshairs), [Pikemen](https://play.abstractplay.com/games/pikemen)

## Stacked pieces (`stacking-offset`)

*Example games:* [Abande](https://play.abstractplay.com/games/abande), [Accasta](https://play.abstractplay.com/games/accasta)

{% renderWidget "samples/pieces-stacked.json" %}

## Dice and text

*Example games:* [Cephalopod](https://play.abstractplay.com/games/cephalopod), [Cubeo](https://play.abstractplay.com/games/cubeo), [Boom & Zoom](https://play.abstractplay.com/games/boom)

{% renderWidget "samples/pieces-dice.json" %}

Text glyphs use `orientation: "vertical"` so labels stay legible when the board rotates.

## Glyph object properties

Each glyph object in the legend supports these properties. `name` and `text` are mutually exclusive.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | string | — | Sheet piece id (no whitespace). Searched across loaded glyph sheets. |
| `text` | string | — | Short text rendered as a glyph instead of sheet artwork. |
| `colour` | colour | — | Primary fill (or player colour when a number). Applied to elements tagged `data-playerfill`. |
| `colour2` | colour | — | Secondary fill for elements tagged `data-playerfill2`. |
| `scale` | number | `1` | Proportional size; values below 1 shrink, above 1 enlarge. |
| `opacity` | number | `1` | 0 (transparent) to 1 (opaque); applied to player-tagged fills and strokes. |
| `rotate` | number \| null | `0` | Degrees, −360 to 360. Negative is counter-clockwise. |
| `orientation` | `"fluid"` \| `"vertical"` | `"fluid"` | After rotation, `"vertical"` keeps text upright. |
| `flipx` | boolean | `false` | Mirror horizontally. |
| `flipy` | boolean | `false` | Mirror vertically. |
| `nudge` | `{ dx, dy }` | — | Offset from centre in cell units; negative `dx`/`dy` move left/up. |
| `fontFamily` | string | — | CSS font family for text glyphs. |
| `fontWeight` | string \| number | — | CSS font weight for text glyphs. |

The legend also supports **polymatrix** entries (arrays of arrays for the polyomino renderer) and **isoPiece** entries (isometric renderer). See [Engines](/renderer/engines/).

### Isometric face overlays

When `renderer` is `isometric`, an `isoPiece` legend entry may layer contact-sheet glyphs onto solid faces:

| Property | Use on | Meaning |
| --- | --- | --- |
| `top` | `cylinder`, `hexp`, `hexf`, hex lintels | Array of glyph objects stacked on the top face (bottom to top), same fields as flat legend glyphs. |
| `decor` | `cube`, cube lintels (`lintelN` … `lintelEW`, …) | Map of intrinsic face (`top`, `north`, `east`, `south`, `west`) to glyph arrays. Uses the same N/E/S/W convention as `faces` on multi-colour cubes—not screen left/right. |

Glyphs are isometrically projected with the active `board.projection` preset and rotate with piece yaw like face colours. Include the sheets that define overlay artwork in render options (for example `piecepack`); the default sheet list is unchanged.

Face decor is **centered** on each face using the glyph **viewBox** (square `use`, same idea as flat legends) and sized to **fill the visible face square** (viewBox-uniform fit to the long side). The legend entry’s **`scale`** multiplies that budget (default **1**; use e.g. **`scale: 0.75`** to shrink decor while keeping piece size unchanged). Sheet glyphs are fitted from their **viewBox** into the visible face region (cube/lintel parallelogram inset, cylinder/hex projected top silhouette). Per-glyph `scale` on each layer still multiplies that baseline. Overlays use the same face transforms as the painted mesh (no separate clip mask).

**Rotation and orientation** (sheet `name` vs `text`):

| Kind | Default | `orientation: "vertical"` | `orientation: "fluid"` |
| --- | --- | --- | --- |
| Sheet glyph | **fluid** | **vertical** (no board bake on **iso tops**) | fluid |
| Text | **vertical** (no board bake on **iso tops**) | same as default | **fluid** |

**Top faces only** (`top` on cylinder/hex, `decor.top` on cubes/lintels): `board.rotate` and render `rotate` affect orientation. On the **isometric** renderer (which does not spin `#board` like flat layouts), **fluid** glyphs get **`+board.rotate` baked into the overlay** so they stay aligned with board edges; **vertical** / default **text** get **no board rotation bake** — cube yaw and the top-face projection already reorient the face so labels stay aligned with board edges (north at 0°, east at 90°, etc.). **Flat legend** layout still **counter-rotates** upright glyphs (`-board.rotate`) so screen orientation stays fixed when `#board` is spun. **Cube/lintel side** `decor` (north/east/south/west): art stays in default face-UV orientation; board spin only changes which side is visible (piece yaw), not rotation on the side. Set `rotate: null` on a glyph to disable rotation for that layer.

**Domino-style blocks:** place complementary cube lintels in adjacent cells (for example `lintelE` and `lintelW`) with different `decor` per cell so shared edges are omitted but each half keeps its own face art.

[Schema reference — legend](/renderer/schema-reference/)

## Contact sheet

All sheet piece names (`piece`, `piece-square`, `meeple`, `d6-1`, chessmen, and so on) are listed in the contact sheet, grouped by sheet:

**[Contact sheet](/renderer/contact-sheet/)**

The image is maintained manually in the renderer repo (`docs/contact-sheet.svg`) and updated when new pieces are added. See [Adding pieces](/renderer/adding-pieces/) for contributor workflow.
