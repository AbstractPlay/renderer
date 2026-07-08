# Rendering engines

The `renderer` property selects specialized layout engines. Default is `default` (flat board, no stacking).

| Engine | Use case |
|--------|----------|
| `default` | Most games |
| `stacking-offset` | Stacked pieces, slight offset |
| `stacking-tiles` | Side-view tile stacks (Volcano-style) |
| `stacking-expanding` | Top-down stacks with expandable column view |
| `stacking-3D` | 3D tile view |
| `homeworlds` / `homeworlds-orig` | Homeworlds systems |
| `entropy` | Entropy side-by-side boards |
| `freespace` | Free placement coordinates |
| `sowing-numerals` / `sowing-pips` | Mancala-style pits |
| `conhex` | ConHex dot boards |
| `multicell-square` | Rectangular piece groups |
| `polyomino` | Polyomino placement |
| `isometric` | Isometric 3D pieces |
| `tree-pyramid` | Tree/pyramid layouts |

Full list: [Schema reference — engines](/renderer/schema-reference/#engines).

## Stacking offset

{% renderWidget "samples/pieces-stacked.json" %}

## Stacking tiles (3D)

{% renderWidget "samples/volcano.json" %}

## Stacking expanding

{% renderWidget "samples/niche-expanding.json" %}

## Homeworlds

{% renderWidget "samples/niche-homeworlds.json" %}

## Freespace

{% renderWidget "samples/niche-freespace.json" %}

## Polyomino

{% renderWidget "samples/niche-polyomino.json" %}

## Isometric

{% renderWidget "samples/niche-isometric.json" %}

## Colour functions

{% renderWidget "samples/niche-functions.json" %}

[Open in playground](https://renderer.dev.abstractplay.com)
