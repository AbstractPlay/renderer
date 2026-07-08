# Formatting

Control labelling, strokes, rotation, tiling, and click zones.

## Rotation

Games may set a base `rotate` on the board (degrees, clockwise):

*Example games:* [Crosshairs](https://play.abstractplay.com/game/crosshairs), [Cannon](https://play.abstractplay.com/game/cannon)

{% renderWidget "samples/formatting-rotation.json" %}

## Custom labels

*Example games:* [Connect6](https://play.abstractplay.com/game/connect6), [Biscuit](https://play.abstractplay.com/game/biscuit)

{% renderWidget "samples/formatting-custom-labels.json" %}

## Strokes and opacity

*Example games:* [Blockade](https://play.abstractplay.com/game/blockade), [Dots and Boxes](https://play.abstractplay.com/game/boxes)

{% renderWidget "samples/formatting-strokes.json" %}

## Tile spacing

Break boards into separated tiles with `tileWidth`, `tileHeight`, `tileSpacing`:

*Example games:* [Alfred's Wyke](https://play.abstractplay.com/game/wyke), [Alien City](https://play.abstractplay.com/game/acity)

{% renderWidget "samples/formatting-tiling.json" %}

## Buffer zones

Extra clickable margin around the board (`buffer` property):

*Example games:* [Boom & Zoom](https://play.abstractplay.com/game/boom), [Dipole](https://play.abstractplay.com/game/dipole)

{% renderWidget "samples/formatting-buffers.json" %}

## Fine-grained click zones

*Example games:* [Azacru](https://play.abstractplay.com/game/azacru), [Pacru](https://play.abstractplay.com/game/pacru)

{% renderWidget "samples/formatting-buffers-separated.json" %}

Renderer options like `hide-labels`, `swap-labels`, and `reverse-letters` are listed in the [schema reference](/renderer/schema-reference/#options).

[Open in playground](https://renderer.dev.abstractplay.com)
