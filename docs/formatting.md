# Formatting

Control labelling, strokes, rotation, tiling, and click zones.

## Rotation

Games may set a base `rotate` on the board (degrees, clockwise):

*Example games:* [Crosshairs](https://play.abstractplay.com/games/crosshairs), [Cannon](https://play.abstractplay.com/games/cannon)

{% renderWidget "samples/formatting-rotation.json" %}

## Custom labels

*Example games:* [Connect6](https://play.abstractplay.com/games/connect6), [Biscuit](https://play.abstractplay.com/games/biscuit)

{% renderWidget "samples/formatting-custom-labels.json" %}

## Strokes and opacity

*Example games:* [Blockade](https://play.abstractplay.com/games/blockade), [Dots and Boxes](https://play.abstractplay.com/games/boxes)

{% renderWidget "samples/formatting-strokes.json" %}

## Tile spacing

Break boards into separated tiles with `tileWidth`, `tileHeight`, `tileSpacing`:

*Example games:* [Alfred's Wyke](https://play.abstractplay.com/games/wyke), [Alien City](https://play.abstractplay.com/games/acity)

{% renderWidget "samples/formatting-tiling.json" %}

With `tileSpacing` to add a gap between tiles:

*Example games:* [Wizard's Garden](https://play.abstractplay.com/games/garden)

{% renderWidget "samples/formatting-tiling-spaced.json" %}

## Buffer zones

Extra clickable margin around the board (`buffer` property):

*Example games:* [Boom & Zoom](https://play.abstractplay.com/games/boom), [Dipole](https://play.abstractplay.com/games/dipole)

{% renderWidget "samples/formatting-buffers.json" %}

## Fine-grained click zones

*Example games:* [Azacru](https://play.abstractplay.com/games/azacru), [Pacru](https://play.abstractplay.com/games/pacru)

{% renderWidget "samples/formatting-buffers-separated.json" %}

## Player colours and patterns

Render options control the per-player palette. Each slot can be a **hex colour** or a **pattern name** (see [Glyphs — Patterns as colours](/renderer/glyphs/#patterns-as-colours)).

```js
colours: ["#e31a1c", "dots", null, "chevrons"]
```

- A **hex string** sets that player's colour.
- A **pattern name** sets that player's fill pattern.
- **`null`** keeps the default for that slot: built-in hex when `patterns` is false, or the matching entry from `patternList` when `patterns` is true.

Setting **`patterns: true`** without a custom `colours` array makes every default player slot use `patternList` instead of the built-in hex palette. You can still mix hex and patterns in `colours` regardless of the `patterns` flag.

```js
patterns: true,
patternList: ["microbial", "honeycomb", "triangles", "wavy"]
```

{% renderWidget "samples/formatting-mixed-patterns.json" %}

Renderer options like `hide-labels`, `swap-labels`, and `reverse-letters` are listed in the [schema reference](/renderer/schema-reference/#options).