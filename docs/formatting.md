# Formatting

Control labelling, strokes, rotation, tiling, and click zones.

## Rotation

Games may set a base `rotate` on the board (degrees, clockwise):

{% renderWidget "samples/formatting-rotation.json" %}

## Custom labels

{% renderWidget "samples/formatting-custom-labels.json" %}

## Strokes and opacity

{% renderWidget "samples/formatting-strokes.json" %}

## Tile spacing

Break boards into separated tiles with `tileWidth`, `tileHeight`, `tileSpacing`:

{% renderWidget "samples/formatting-tiling.json" %}

## Buffer zones

Extra clickable margin around the board (`buffer` property):

{% renderWidget "samples/formatting-buffers.json" %}

## Fine-grained click zones

{% renderWidget "samples/formatting-buffers-separated.json" %}

Renderer options like `hide-labels`, `swap-labels`, and `reverse-letters` are listed in the [schema reference](/renderer/schema-reference/#options).

[Open in playground](https://renderer.dev.abstractplay.com)
