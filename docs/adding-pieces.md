# Adding pieces

This page is for **renderer contributors** adding new basic pieces — the named artwork referenced by `name` in game JSON (e.g. `piece`, `piece-square`, `meeple`, `d6-1`). Game authors use those names in their `legend`; they do not add sheet artwork themselves.

## Overview

1. Add the SVG artwork as a **symbol** in the appropriate sheet file under `src/sheets/contact/`.
2. Register the sheet in `src/sheets/contact/index.ts` if you created a new sheet.
3. Run tests (`npm test`).
4. Regenerate committed glyph artifacts (contact sheet + slot catalog — see below).
5. Open a PR.

## Choose a sheet

| Sheet | When to use |
| --- | --- |
| `core` | Generic Abstract Play pieces most games can share |
| `dice`, `chess`, `dominoes`, … | Domain-specific sets (see [Contact sheet](/renderer/contact-sheet/)) |
| `experimental` | Prototypes not yet ready for general use |
| **New sheet** | A large, cohesive set that does not belong in an existing file |

Piece names must be unique **within the search path** for a render. The renderer walks the `sheets` option (default list in `RendererBase`) and returns the first match.

## Define a piece

Each sheet file exports an `ISheet` whose `glyphs` map uses **`defineGlyph`** so slot metadata stays next to the builder ([`designing-glyphs`](/renderer/designing-glyphs/) for full detail):

```typescript
import { defineGlyph } from "../registry/defineGlyph.js";

const TOKEN_SLOTS = {
    fill: { channels: ["fill"], description: "Primary player colour." },
    border: { channels: ["stroke"], description: "Outline or rim." },
} as const;

defineGlyph(sheet, "piece", {
    slots: TOKEN_SLOTS,
    colour2Slot: "border",
    build(canvas) {
        const group = canvas.symbol();
        group
            .circle(sheet.cellsize)
            .attr("data-slot-fill", "fill")
            .attr("data-context-border", true)
            .fill("#fff")
            .stroke({ width: 5, color: "#000" })
            .center(sheet.cellsize / 2, sheet.cellsize / 2);
        group.viewbox(-2.5, -2.5, sheet.cellsize + 5, sheet.cellsize + 5);
        return group;
    },
});
```

### Rules

- **Alphabetize** `defineGlyph` / `sheet.glyphs.set(...)` calls by piece name (enforced by tests).
- **No hard-coded symbol ids** in sheet SVG — the renderer assigns ids when composing legends.
- Set a **`viewbox`** on every symbol (or `data-cellsize` on the root) so scaling works.
- Bind legend **`paint`** with **`data-slot-fill`** / **`data-slot-stroke`** (slot names `fill`, `border`, `detail`, …).
- Use **`data-context-*`** for theme-driven defaults until legend paint overrides:

| Attribute | Maps to colour context |
| --- | --- |
| `data-context-fill` | `fill` |
| `data-context-background` | `background` |
| `data-context-stroke` | `strokes` |
| `data-context-border` | `borders` (stroke on **`border`** slot) |
| `data-context-border-fill` | `borders` (fill channel on **`border`** slot) |
| `data-context-board` | `board` |

**One-arg builders only** — pass `(canvas) => symbol`. Player colours come from legend **`paint`**, not builder arguments (orbs use procedural shading in the renderer).

Do **not** add new `data-playerfill*` attrs; slot bindings are required on contact-sheet glyphs.

### New sheet checklist

1. Create `src/sheets/contact/mySheet.ts` implementing `ISheet` (`name`, `description`, `cellsize`, `glyphs`).
2. Import and append it to `contactSheets` in `src/sheets/contact/index.ts`.
3. Add the sheet id to the default `sheets` list in `src/renderers/_base.ts` if games should load it by default; otherwise document that games must pass it in render options.

## Regenerate glyph artifacts

After adding, renaming, or retagging pieces (including `paint` / slot attributes), run:

```bash
npm run regenerate-glyphs
```

This runs `contact-sheet`, `glyph-catalog`, and the **glyph paint slot audit** (uniform `paint.fill` / `paint.border` / `paint.detail` at player 1 — fails if any ink is not recoloured except `paintMode: fixed`, procedural orbs, or optional slots such as `target`). Then commit the updated files:

| Output | Purpose |
| --- | --- |
| `docs/contact-sheet.svg`, `docs/fonts/dejavu-sans.ttf`, `contact.png` | Visual name reference ([contact sheet](/renderer/contact-sheet/)); PNG is 96 DPI for the GitHub README |
| `src/sheets/registry/glyph-slots.catalog.json`, `docs/glyph-slots.md` | Slot registry for `paint` and the [Glyph paint slots](/renderer/glyph-slots/) doc |

Labels on the contact sheet use **DejaVu Sans**, bundled as TTF so resvg renders text reliably on all platforms. Set `CONTACT_SHEET_DPI=72` before `regenerate-glyphs` for a smaller PNG if you prefer.

CI runs `npm run verify-glyphs`, which regenerates these outputs and fails if anything would change in git.

Individual commands remain available: `npm run contact-sheet`, `npm run glyph-catalog`, `npm run glyph-paint-audit`. For local debugging only, add `-- --write` to export failure SVGs under `.test-artifacts/glyph-paint-audit/` (CI lists offending glyphs in the error only).

## Verify

```bash
npm test
```

The `Glyph sheets` tests check that file names match sheet names and that glyph entries stay alphabetized.
