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

Each panel is measured once on the output SVG (no click handlers) using `unionLayoutBBox`, then cleared before the next panel. Prefixed panel markup is composed under `#ap-composite-panels`. When `boardClick` is set, a single delegated handler on that group routes hits to the correct `panels[].id` (square boards today). Panel titles (`panels[].label`) are drawn in layout space above each board, separate from row/column labels on the board itself.

## API

```javascript
import { renderComposite } from "@abstractplay/renderer";

renderComposite(compositeJson, {
  divid: "drawing",
  showAnnotations: true,
  boardClick(panelId, row, col, piece) { /* ... */ },
});
```

- **`renderComposite`** is a separate export from **`render`**.
- Do **not** pass **`opts.rotate`** on the composite call (it is rejected). Set **`panels[].rotate`** in JSON instead.
- **`showAnnotations`** applies to every panel.
- **`boardHover`** is not wired for composites yet (typed on `IRenderCompositeOptions` for a future pass).

Integrators (Abstract Play front, gameslib) must detect `kind: "composite"`, call **`renderComposite`** instead of **`render`**, and route clicks with **`panelId`** — not covered in this package beyond the API above.

Schema: `src/schemas/composite-schema.json` (references `APRenderComposite` in the main schema `$defs`).

Examples:

- Playground **Composite: Dual boards** (`row`) and **Composite: 2×2 grid** (`grid` with `columns: 2`).
- Pretty-printed JSON: [`docs/samples/composite-grid-2x2.json`](samples/composite-grid-2x2.json).
