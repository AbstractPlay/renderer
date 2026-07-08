# Concepts

The JSON document describes the **game table**: at minimum a `board` and `pieces`. Optional sections add glyphs, side areas, and annotations.

## Top-level structure

| Property | Required | Role |
|----------|----------|------|
| `renderer` | no | Which rendering engine to use (default: `default`) |
| `board` | yes | Board geometry and style |
| `pieces` | yes | Piece placement (format varies by renderer) |
| `legend` | no | Maps keys to glyphs/colours |
| `areas` | no | Side panels (stashes, buttons, etc.) |
| `annotations` | no | Overlays for moves and highlights |
| `options` | no | Renderer flags |

See the [schema reference](schema-reference/) for the authoritative property list.

## Board

The board is drawn first. Styles include square grids, vertex boards, hex fields, sowing pits, circular boards, and many more. See [Boards](boards/).

## Pieces

Usually a string grid (rows separated by `\n`) where each character maps through `legend`. Specialized renderers use arrays or structured objects instead. See [Engines](engines/).

## Legend

Maps short keys to glyph definitions — simple names, composite arrays, gradients, player colours, text glyphs, etc. See [Glyphs](glyphs/).

## Areas

Vertical sections below the board: piece stashes, button bars, Homeworlds stashes, polyomino holding areas, and more.

## Annotations

Drawn above pieces: move arrows, enter/exit markers, dots, outlines, etc. See [Annotations](annotations/).

## Example

{% renderWidget "samples/pieces-simple.json" %}

[Open in playground](https://renderer.dev.abstractplay.com)
