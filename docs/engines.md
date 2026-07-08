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

*Example games:* [Arimaa](https://play.abstractplay.com/game/arimaa), [Go](https://play.abstractplay.com/game/go)

{% renderWidget "samples/pieces-simple.json" %}

## Stacking offset

*Example games:* [Abande](https://play.abstractplay.com/game/abande), [Accasta](https://play.abstractplay.com/game/accasta)

{% renderWidget "samples/pieces-stacked.json" %}

## Stacking tiles

*Example games:* [Byte](https://play.abstractplay.com/game/byte), [Focus](https://play.abstractplay.com/game/focus)

{% renderWidget "samples/niche-stacking-tiles.json" %}

## Stacking expanding

*Example games:* [Volcano](https://play.abstractplay.com/game/volcano), [Mega-Volcano](https://play.abstractplay.com/game/mvolcano)

{% renderWidget "samples/niche-expanding.json" %}

## Stacking 3D

*Example games:* [Volcano](https://play.abstractplay.com/game/volcano), [Pylon](https://play.abstractplay.com/game/pylon)

{% renderWidget "samples/volcano.json" %}

## Homeworlds

*Example games:* [Homeworlds](https://play.abstractplay.com/game/homeworlds)

{% renderWidget "samples/niche-homeworlds.json" %}

## Entropy

*Example games:* [Entropy](https://play.abstractplay.com/game/entropy)

{% renderWidget "samples/niche-entropy.json" %}

## Freespace

*Example games:* [Armadas](https://play.abstractplay.com/game/armadas), [Calculus](https://play.abstractplay.com/game/calculus)

{% renderWidget "samples/niche-freespace.json" %}

## Sowing numerals

*Example games:* [Bao](https://play.abstractplay.com/game/bao), [Oware](https://play.abstractplay.com/game/oware)

{% renderWidget "samples/boards-sowing-numerals.json" %}

## Sowing pips

*Example games:* [Bao](https://play.abstractplay.com/game/bao), [Oware](https://play.abstractplay.com/game/oware)

{% renderWidget "samples/boards-sowing-pips.json" %}

## ConHex

*Example games:* [ConHex](https://play.abstractplay.com/game/conhex)

{% renderWidget "samples/boards-conhex-dots.json" %}

## Multicell square

*Example games:* [Fightopia](https://play.abstractplay.com/game/fightopia)

{% renderWidget "samples/niche-multicell.json" %}

## Polyomino

*Example games:* [Four](https://play.abstractplay.com/game/four)

{% renderWidget "samples/niche-polyomino.json" %}

## Isometric

Height-mapped boards with 3D piece glyphs. Set `board.projection` to choose camera elevation and ground-axis foreshortening.

*Example games:* [Bide](https://play.abstractplay.com/game/bide), [Carnac](https://play.abstractplay.com/game/carnac), [Terrace](https://play.abstractplay.com/game/terrace)

{% renderWidget "samples/niche-isometric.json" %}

### `iso`

Classic 2:1 isometric (default when `projection` is omitted).

*Example games:* [Bide](https://play.abstractplay.com/game/bide), [Terrace](https://play.abstractplay.com/game/terrace)

{% renderWidget "samples/engine-isometric-iso.json" %}

### `shallow`

Raised viewpoint — less vertical foreshortening.

*Example games:* [Carnac](https://play.abstractplay.com/game/carnac), [Druid](https://play.abstractplay.com/game/druid)

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

*Example games:* [Siege of Jacynth](https://play.abstractplay.com/game/siegeofj)

{% renderWidget "samples/board-other.json" %}

[Open in playground](https://renderer.dev.abstractplay.com)
