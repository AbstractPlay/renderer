---
layout: layouts/base.njk
permalink: /renderer/schema-reference/
title: Schema reference
useRenderWidget: true
generated: true
schemaVersion: 0.7.0
---

# Schema reference (v0.7.0)

Auto-generated from `schema.json`. Narrative documentation is in the other renderer pages.

## Top-level properties

| Property | Required | Description |
| --- | --- | --- |
| renderer | no | The rendering engine the game wants to use. |
| board | yes | This is the game board itself. |
| pieces | yes | Describes what pieces are where. For the `entropy` renderer, the pieces should be laid out on a grid 14 cells wide, which the renderer will break up into the two different boards. For cobweb boards, the center space is the final row, by itself. And for the `sowing` boards, the end pits (if present) should also appear on a row by themselves, west first (left), then east (right). |
| legend | no | Map each `piece` to an actual glyph with possible options. |
| areas | no | Areas are renderer-specific elements that are used and rendered in various ways. |
| annotations | no | Instruct the renderer how to show any changes to the game state. See the docs for details. For the `entropy` renderer, the pieces are theoretically laid out on a grid 14 cells wide. So to show annotations on the second board, you will reference column indexes starting at 7. The number of rows does not change. |
| options | no | Optional list of renderer flags. See [Renderer options](#options) below. |

## Renderer engines <span id="engines"></span>

| Engine |
| --- |
| `default` |
| `stacking-offset` |
| `stacking-tiles` |
| `stacking-expanding` |
| `stacking-3D` |
| `homeworlds` |
| `homeworlds-orig` |
| `entropy` |
| `freespace` |
| `sowing-numerals` |
| `sowing-pips` |
| `conhex` |
| `multicell-square` |
| `polyomino` |
| `isometric` |
| `tree-pyramid` |

## Board styles <span id="board-styles"></span>

| Style |
| --- |
| `squares` |
| `squares-checkered` |
| `squares-beveled` |
| `squares-stacked` |
| `squares-diamonds` |
| `vertex` |
| `vertex-cross` |
| `vertex-fanorona` |
| `pegboard` |
| `hex-slanted` |
| `hex-odd-p` |
| `hex-even-p` |
| `hex-odd-f` |
| `hex-even-f` |
| `hex-of-hex` |
| `hex-of-tri` |
| `hex-of-tri-f` |
| `hex-of-cir` |
| `rect-of-tri` |
| `snubsquare` |
| `snubsquare-cells` |
| `onyx` |
| `pentagonal` |
| `pentagonal-bluestone` |
| `bent-tri` |
| `star` |
| `circular-wheel` |
| `circular-cobweb` |
| `circular-moon` |
| `sowing` |
| `sowing-round` |
| `conhex-dots` |
| `conhex-cells` |
| `cairo-collinear` |
| `cairo-catalan` |
| `triangles-stacked` |
| `conical-hex` |
| `conical-hex-narrow` |
| `pyramid-hex` |
| `heightmap-squares` |
| `dvgc` |
| `dvgc-checkered` |
| `other` |

## Renderer options <span id="options"></span>

| Option | Description |
| --- | --- |
| `hide-labels` | Hides all external row and column labels around the board. |
| `hide-labels-half` | On boards with labels on every side (e.g. `squares*`), hides only the top and right labels. |
| `hide-star-points` | On square `vertex` boards, hides the decorative star points. |
| `no-border` | Hides the outer border line on square-based boards. |
| `hw-light` | Homeworlds: swaps background and contrast colours for a lighter theme. |
| `hw-no-buttons` | Homeworlds: hides the sacrifice, pass, and other action buttons. |
| `hw-system-only` | Homeworlds: renders only the first star system and skips the full layout. |
| `clickable-edges` | On `squares*` and rect-of-hex boards, makes individual cell edges clickable. |
| `reverse-letters` | Reverses the order of letter labels (columns or rows, depending on board). |
| `reverse-numbers` | Reverses the order of numeric labels. |
| `swap-labels` | Swaps which axis uses letter labels and which uses numeric labels. |
| `no-piece-click` | Disables click targets on pieces; only board cells receive clicks. |
| `no-piece-shadow` | Isometric: disables contact shadows drawn under pieces. |
| `no-iso-depth-shade` | Isometric: disables height-based shading on cells. |
| `no-iso-cell-footprint` | Isometric: disables the ground footprint drawn under elevated cells. |
