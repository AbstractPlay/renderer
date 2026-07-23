# Rendering engines

The `renderer` property selects specialized layout engines. Default is `default` (flat board, no stacking).

| Engine | Use case |
|--------|----------|
| `default` | Most games |
| `stacking-offset` | Stacked pieces, slight offset |
| `stacking-tiles` | Side-view tile stacks (Volcano-style) |
| `stacking-expanding` | Top-down stacks with expandable column view |
| `stacking-3D` | 3D tile view |
| `homeworlds` | Homeworlds systems |
| `entropy` | Entropy side-by-side boards |
| `freespace` | Free placement coordinates |
| `sowing-numerals` / `sowing-pips` | Mancala-style pits |
| `conhex` | ConHex dot boards |
| `multicell-square` | Rectangular piece groups |
| `polyomino` | Polyomino placement |
| `isometric` | Isometric 3D pieces |
| `tree-pyramid` | Tree/pyramid layouts |

Full list: [Schema reference — engines](/renderer/schema-reference/#engines).

## Default

Simple pieces on boards.

*Example games:* [Arimaa](https://play.abstractplay.com/games/arimaa), [Go](https://play.abstractplay.com/games/go)

{% renderWidget "samples/pieces-simple.json" %}

## Stacking offset

Simulate stacks by offsetting additional pieces slightly.

*Example games:* [Abande](https://play.abstractplay.com/games/abande), [Accasta](https://play.abstractplay.com/games/accasta)

{% renderWidget "samples/pieces-stacked.json" %}

## Stacking tiles

Show a side view of pieces in a stack. Best for smallish stacks.

*Example games:* [Byte](https://play.abstractplay.com/games/byte), [Focus](https://play.abstractplay.com/games/focus)

{% renderWidget "samples/niche-stacking-tiles.json" %}

## Stacking expanding

This engine is basically deprecated. It's a top-down view with a column to the side that shows the hovered pieces (doesn't work in the preview snippet).

*Example games:* [Volcano](https://play.abstractplay.com/games/volcano), [Mega-Volcano](https://play.abstractplay.com/games/mvolcano)

{% renderWidget "samples/niche-expanding.json" %}

## Stacking 3D

The preferred way of showing stacked pyramids on a flat board.

*Example games:* [Volcano](https://play.abstractplay.com/games/volcano), [Pylon](https://play.abstractplay.com/games/pylon)

{% renderWidget "samples/volcano.json" %}

## Homeworlds

A bespoke engine specifically for Homeworlds.

*Example games:* [Homeworlds](https://play.abstractplay.com/games/homeworlds)

{% renderWidget "samples/niche-homeworlds.json" %}

## Entropy

A bespoke engine specifically for the game Entropy, but could conceivably be leveraged for other games played in a similar "duplicate" style.

*Example games:* [Entropy](https://play.abstractplay.com/games/entropy)

{% renderWidget "samples/niche-entropy.json" %}

## Freespace

Gives the game designer complete fine-grained control over placement of elements on the canvas.

*Example games:* [Armadas](https://play.abstractplay.com/games/armadas), [Calculus](https://play.abstractplay.com/games/calculus)

{% renderWidget "samples/niche-freespace.json" %}

## Sowing numerals

*Example games:* [Bao](https://play.abstractplay.com/games/bao), [Oware](https://play.abstractplay.com/games/oware)

{% renderWidget "samples/boards-sowing-numerals.json" %}

## Sowing pips

*Example games:* [Bao](https://play.abstractplay.com/games/bao), [Oware](https://play.abstractplay.com/games/oware)

{% renderWidget "samples/boards-sowing-pips.json" %}

## ConHex

*Example games:* [ConHex](https://play.abstractplay.com/games/conhex)

{% renderWidget "samples/boards-conhex-dots.json" %}

## Multicell square

Let's you stretch pieces across multiple cells (only rectangular configurations of cells supported).

*Example games:* [Fightopia](https://play.abstractplay.com/games/fightopia)

{% renderWidget "samples/niche-multicell.json" %}

## Polyomino

*Example games:* [Four](https://play.abstractplay.com/games/four)

{% renderWidget "samples/niche-polyomino.json" %}

## Isometric

Height-mapped boards with 3D piece glyphs. Set `board.projection` to choose camera elevation and ground-axis foreshortening.

*Example games:* [Bide](https://play.abstractplay.com/games/bide), [Carnac](https://play.abstractplay.com/games/carnac), [Terrace](https://play.abstractplay.com/games/terrace)

{% renderWidget "samples/niche-isometric.json" %}

Sheet glyphs can be layered onto isometric solids using `top` (cylinders and hex prisms) and `decor` (cubes and cube lintels). See [Glyphs — isometric face overlays](/renderer/glyphs/#isometric-face-overlays).

{% renderWidget "samples/niche-isometric-overlays.json" %}

### `iso`

Classic 2:1 isometric (default when `projection` is omitted).

*Example games:* [Bide](https://play.abstractplay.com/games/bide), [Terrace](https://play.abstractplay.com/games/terrace)

{% renderWidget "samples/engine-isometric-iso.json" %}

### `shallow`

Raised viewpoint — less vertical foreshortening.

*Example games:* [Carnac](https://play.abstractplay.com/games/carnac), [Druid](https://play.abstractplay.com/games/druid)

{% renderWidget "samples/engine-isometric-shallow.json" %}

### `very-shallow`

Even higher viewpoint.

{% renderWidget "samples/engine-isometric-very-shallow.json" %}

### `compressed`

Iso azimuth with the depth axis at half scale.

{% renderWidget "samples/engine-isometric-compressed.json" %}

### `cabinet`

Cabinet oblique — east–west undistorted, depth at 45° half scale.

{% renderWidget "samples/engine-isometric-cabinet.json" %}

### `dimetric`

Both ground axes foreshortened equally at the iso azimuth.

{% renderWidget "samples/engine-isometric-dimetric.json" %}

### `trimetric`

Ground axes foreshortened unequally at the iso azimuth.

{% renderWidget "samples/engine-isometric-trimetric.json" %}

## Tree pyramid

This is a specialized engine used only in [Siege of Jacynth](https://play.abstractplay.com/games/siegeofj) where there is no board, but trees of pieces are laid out based on child/parent relationships.

*Example games:* [Siege of Jacynth](https://play.abstractplay.com/games/siegeofj)

{% renderWidget "samples/board-other.json" %}