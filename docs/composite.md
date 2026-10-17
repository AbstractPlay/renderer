# Composite renders (multiple boards)

Some games need **more than one independent board** in a single SVG—for example chess-like variants with two play areas. These games emit a **composite** document (`kind: "composite"`) instead of a plain `APRenderRep`.

Single-board games are unchanged: keep producing a normal render rep and call `APRender.render()`.

## Document shape

- **`kind`:** must be `"composite"`.
- **`layout`:** `arrangement` (`row`, `column`, or `grid`), optional `gap` (in 50px cell units, default `1`), optional `align` (`start` | `center` | `end`, default `center`). For `grid`, **`columns`** is required; panels fill left-to-right, top-to-bottom in array order. The compositor reserves a **fixed cell** per panel: each grid row shares one **row board height** (max measured height in that row) and each column shares one **column board width** (max in that column). Equal-sized boards therefore share the same cell box and line up; smaller boards are positioned with `align` inside that cell. Panel titles are centered on the cell, not only on the board ink.
- **`panels`:** each entry has:
  - **`id`** — stable string for labels and `boardClick` routing.
  - **`label`** — optional plain string or structured render label (drawn above the panel).
  - **`rotate`** — optional `0`, `90`, `180`, or `270` (per-panel only; same semantics as seat rotation on a single board).
  - **`render`** — a complete normal render rep (`board`, `pieces`, `legend`, `renderer`, etc.).

There is no composite-level `legend`; duplicate `legend` / `glyphDefs` on each panel as needed—the compositor prefixes SVG ids per panel to avoid collisions.

### Cross-panel annotations

Optional top-level **`annotations`** draw move arrows, polylines, dots, or outlines in composite SVG space (layer `#ap-composite-annotations`, above all panels). Each target is a **`compositeCellRef`**: `{ "panel": "<panels[].id>", "row", "col" }` (logical cell indices on that panel’s board, respecting `panels[].rotate`).

| Intent | Where to author |
|--------|-----------------|
| Arrow entirely on one board | `panels[i].render.annotations` (unchanged) |
| Arrow between panels | top-level `annotations` |

Supported types today: `move`, `line`, `dots`, `outline`. Square boards only (same constraint as composite `boardClick`). Requires **`showAnnotations: true`** on `renderComposite` (includes per-panel `render.annotations`).

Example: [`docs/samples/composite-cross-panel-arrow.json`](samples/composite-cross-panel-arrow.json).

Each panel is measured once on the output SVG (no per-tile handlers) using `unionLayoutBBox`, then cleared before the next panel. Prefixed panel markup is composed under `#ap-composite-panels`. When `boardClick` or `boardHover` is set, delegated handlers on that group route hits to the correct `panels[].id` (square boards today). Hover dedupes repeated `pointermove` events for the same panel cell. Panel titles (`panels[].label`) are drawn in layout space above each board, separate from row/column labels on the board itself.

## API

```javascript
import { renderComposite } from "@abstractplay/renderer";

renderComposite(compositeJson, {
  divid: "drawing",
  showAnnotations: true,
  boardClick(panelId, row, col, piece) { /* ... */ },
  boardHover(panelId, row, col, piece) { /* e.g. stacking-expanding column */ },
});
```

- **`renderComposite`** is a separate export from **`render`**.
- Do **not** pass **`opts.rotate`** on the composite call (it is rejected). Set **`panels[].rotate`** in JSON instead.
- **`showAnnotations`** applies to every panel.
- **`boardHover(panelId, row, col, piece)`** — same routing as `boardClick`; intended for integrators that call `renderColumn` for a side stack (not composite JSON).

Integrators (Abstract Play front, gameslib) must detect `kind: "composite"`, call **`renderComposite`** instead of **`render`**, and route clicks with **`panelId`** — not covered in this package beyond the API above.

Schema: `src/schemas/composite-schema.json` (references `APRenderComposite` in the main schema `$defs`).

Examples:

- Playground **Composite: Dual boards** (`row`), **Composite: 2×2 grid** (`grid` with `columns: 2`), and **Composite: Cross-panel arrow** (`showAnnotations`).
- Pretty-printed JSON: [`composite-grid-2x2.json`](samples/composite-grid-2x2.json), [`composite-cross-panel-arrow.json`](samples/composite-cross-panel-arrow.json).
