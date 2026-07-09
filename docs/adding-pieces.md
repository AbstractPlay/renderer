# Adding pieces

This page is for **renderer contributors** adding new basic pieces — the named artwork referenced by `name` in game JSON (e.g. `piece`, `piece-square`, `meeple`, `d6-1`). Game authors use those names in their `legend`; they do not add sheet artwork themselves.

## Overview

1. Add the SVG artwork as a **symbol** in the appropriate sheet file under `src/sheets/`.
2. Register the sheet in `src/sheets/index.ts` if you created a new sheet.
3. Run tests (`npm test`).
4. Update `docs/contact-sheet.svg` manually (see below).
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

Each sheet file exports an `ISheet` with a `glyphs` map. Every entry is a function that returns an SVG `symbol`:

```typescript
sheet.glyphs.set("piece", (canvas: SVGContainer) => {
    const group = canvas.symbol();
    group.circle(sheet.cellsize)
        .attr("data-playerfill", true)
        .attr("data-context-border", true)
        .fill("#fff")
        .stroke({ width: 5, color: "#000" })
        .center(sheet.cellsize / 2, sheet.cellsize / 2);
    group.viewbox(-2.5, -2.5, sheet.cellsize + 5, sheet.cellsize + 5);
    return group;
});
```

### Rules

- **Alphabetize** `sheet.glyphs.set(...)` calls by piece name (enforced by tests).
- **No hard-coded symbol ids** in sheet SVG — the renderer assigns ids when composing legends.
- Set a **`viewbox`** on every symbol (or `data-cellsize` on the root) so scaling works.
- Use **`data-playerfill`** on shapes that should receive `colour` / player colours.
- Use **`data-playerfill2`** / **`data-playerstroke2`** for a second colour (`colour2`).
- Use **`data-context-*`** for theme-driven strokes and fills:

| Attribute | Maps to colour context |
| --- | --- |
| `data-context-fill` | `fill` |
| `data-context-background` | `background` |
| `data-context-stroke` | `strokes` |
| `data-context-border` | `borders` |
| `data-context-board` | `board` |

Some glyphs accept a colour argument `(canvas, color) => symbol` for two-tone sheet art; most use the data attributes above.

### New sheet checklist

1. Create `src/sheets/mySheet.ts` implementing `ISheet` (`name`, `description`, `cellsize`, `glyphs`).
2. Import and append it to the array in `src/sheets/index.ts`.
3. Add the sheet id to the default `sheets` list in `src/renderers/_base.ts` if games should load it by default; otherwise document that games must pass it in render options.

## Update the contact sheet

After adding or renaming pieces, regenerate the visual reference and commit both outputs:

```bash
npm run contact-sheet
```

This writes `docs/contact-sheet.svg` (full resolution, for the docs site), `docs/fonts/dejavu-sans.ttf` (label font), and `contact.png` (96 DPI raster for the GitHub README). Labels use **DejaVu Sans**, bundled as TTF so resvg renders text reliably on all platforms. Set `CONTACT_SHEET_DPI=72` for a smaller PNG if you prefer.

CI will fail if sheet sources change without updating these committed files.

## Verify

```bash
npm test
```

The `Glyph sheets` tests check that file names match sheet names and that glyph entries stay alphabetized.
