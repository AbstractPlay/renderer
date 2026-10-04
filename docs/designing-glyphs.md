# Designing sheet glyphs

Contributor guide for **contact-sheet artwork** referenced by `name` in game JSON. Game authors set colours through legend **`paint`** (see [Glyphs](/renderer/glyphs/) and [Glyph paint slots](/renderer/glyph-slots/)); this page covers how sheet symbols declare which regions accept those colours.

## Mental model

1. **Build time (sheet):** geometry, default fills/strokes, and **slot bindings** (`data-slot-fill`, `data-slot-stroke`, optional `data-context-*` for theme defaults).
2. **Render time (legend):** `paint.fill`, `paint.border`, `paint.detail`, … map to bound regions. Omitted slots keep sheet defaults.

Text overlays (`text` in the legend) are **not** sheet glyphs — they use optional **`colour`** only; do not add slot attrs for text.

## `defineGlyph`

Register pieces with metadata next to the build function ([`src/sheets/defineGlyph.ts`](../../src/sheets/defineGlyph.ts)):

```typescript
import { defineGlyph } from "../registry/defineGlyph.js";

const DUOTONE_SLOTS = {
    fill: { channels: ["fill"], description: "Primary player colour." },
    border: { channels: ["stroke", "fill"], description: "Rim or outline band." },
} as const;

defineGlyph(sheet, "my-piece", {
    slots: DUOTONE_SLOTS,
    colour2Slot: "border",
    build(canvas) {
        const g = canvas.symbol();
        g.circle(sheet.cellsize)
            .attr("data-slot-fill", "fill")
            .fill("#fff");
        g.circle(sheet.cellsize)
            .attr("data-slot-stroke", "border")
            .attr("data-context-border", true)
            .fill("none")
            .stroke({ width: 5, color: "#000" });
        g.viewbox(-2.5, -2.5, sheet.cellsize + 5, sheet.cellsize + 5);
        return g;
    },
});
```

| Field | Purpose |
| --- | --- |
| `slots` | Named paint regions and which SVG channel each uses (`fill` and/or `stroke`). |
| `colour2Slot` | Where legacy legend **`colour2`** maps during transition: **`border`** (chess, arimaa, most duotone) or **`detail`** (dice pips, gnostica wedges, `orca` second tone). Default **`border`**. |
| `paintMode: "proceduralShaded"` | Orbs only — tinting and gradients run in [`orbShading.ts`](../../src/renderers/orbShading.ts), not in the sheet builder. |
| `paintMode: "fixed"` | Hard-coded colours only (e.g. core `brick` / `bricks`); legend `paint` is ignored. |
| `build` | One-arg `(canvas) => symbol` — **no** player colour argument. |

After edits, run `npm run regenerate-glyphs` and commit catalog + contact sheet outputs (see [Adding pieces](/renderer/adding-pieces/)).

## Slot bindings

Tag elements that should receive legend **`paint`**:

| Attribute | Meaning |
| --- | --- |
| `data-slot-fill="fill"` | Primary player fill (body, main silhouette). |
| `data-slot-stroke="fill"` | Primary colour on a **stroke-only** shape (e.g. `circle` token) — slot name is still **`fill`**. |
| `data-slot-fill="border"` / `data-slot-stroke="border"` | Rim, outline band, or theme border stroke. |
| `data-slot-fill="detail"` | Secondary interior (dice pips, decorative ink). |

**Do not** add `data-playerfill`, `data-playerfill2`, or related legacy attrs on new art — CI enforces slot-only symbols ([`test/sheets/slots.test.ts`](../../test/sheets/slots.test.ts)).

### Theme context defaults

Use **`data-context-*`** where the sheet should follow the active colour context until legend **`paint`** overrides:

| Attribute | Context key |
| --- | --- |
| `data-context-fill` | `fill` |
| `data-context-stroke` | `strokes` |
| `data-context-border` | `borders` (stroke) |
| `data-context-border-fill` | `borders` (fill channel on **`border`** slot) |

Slot paint runs after context defaults; explicit `paint.border` / `paint.fill` wins over context.

## Duotone vs dice vs orbs

| Family | Typical slots | `colour2Slot` |
| --- | --- | --- |
| Disc-like (`piece`, hex, meeple) | `fill`, `border` | `border` |
| Chess / arimaa / experimental bodies | `fill`, `border` | `border` |
| Dice `d6-*` | `fill`, `border`, `detail` (pips) | `detail` |
| Orbs `orb*` | `fill` (+ optional `detail` highlights) | procedural shaded |
| Gnostica / `orca` | `fill`, `detail`, `border` | `detail` where `colour2` was pips/wedge |

## Glyphmap

Legend **`name`** may be remapped (customize UI). **`paint`** keys apply to bindings on the **loaded** symbol. Extra keys (e.g. `paint.border` on `piece-borderless`) are ignored at runtime; the front end may warn when slot sets differ.

Compare slot lists in [Glyph paint slots](/renderer/glyph-slots/) when documenting safe swaps (e.g. `piece` ↔ `hex-flat`).

## Contact sheet preview

[`glyphPreview.ts`](../../src/renderers/glyphPreview.ts) builds contact-sheet tiles: most glyphs use sheet defaults only; **orbs** run the same procedural **`paint.fill`** path as in-game rendering (neutral preview tint).

## Migrating game JSON

In-repo samples and playground snippets use **`paint`** on **`name`** layers. To convert older game files:

```bash
npm run migrate-glyph-paint -- --write path/to/render.json
npm run migrate-glyph-paint -- --verify
```

The migrator touches **`legend`** sheet glyphs only (including composite arrays and isometric face overlays). It leaves **`text`** layers, markers, board fields, and areas unchanged. **`colour2`** → `paint.border` or `paint.detail` per the glyph catalog.

## See also

- [Adding pieces](/renderer/adding-pieces/) — workflow and regenerate commands
- [Glyphs](/renderer/glyphs/) — author-facing legend reference
- [Glyph paint slots](/renderer/glyph-slots/) — generated slot list per sheet glyph
