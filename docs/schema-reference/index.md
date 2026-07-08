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
| options | no | A list of flags to pass to the renderer. The `hide-labels` option hides all external row/column labels. The `hide-labels-half` option only applies to boards with double labelling (e.g., square boards), and it hides the labels on the top and right of the board. `no-border` hides the very outside border of the square boards. The `hw-*` options are for Homeworlds. The option `clickable-edges` only applies to rect-of-hex and `squares*` boards and makes the individual edges clickable. The option `reverse-letters` reverses the order of the column or row displaying letters. The option `reverse-numbers` does the same for numerical labelling. The option `swap-labels` swaps the position of the letters and numbers. The option `no-piece-click` disables all click handling of pieces; instead only the board cells themselves detect the clicks. |

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

| Option |
| --- |
| `hide-labels` |
| `hide-labels-half` |
| `hide-star-points` |
| `no-border` |
| `hw-light` |
| `hw-no-buttons` |
| `hw-system-only` |
| `clickable-edges` |
| `reverse-letters` |
| `reverse-numbers` |
| `swap-labels` |
| `no-piece-click` |
| `no-piece-shadow` |
| `no-iso-depth-shade` |
| `no-iso-cell-footprint` |

