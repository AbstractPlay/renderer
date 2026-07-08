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

See the [schema reference](/renderer/schema-reference/) for the authoritative property list.

## Board

The board is drawn first. Styles include square grids, vertex boards, hex fields, sowing pits, circular boards, and many more. See [Boards](/renderer/boards/).

*Example games:* [Go](https://play.abstractplay.com/game/go), [Volcano](https://play.abstractplay.com/game/volcano)

## Pieces

Usually a string grid (rows separated by `\n`) where each character maps to a `legend` entry that represents a piece on the board. Specialized renderers use arrays or structured objects instead. See [Engines](/renderer/engines/).

*Example games:* [Arimaa](https://play.abstractplay.com/game/arimaa), [Bao](https://play.abstractplay.com/game/bao)

## Legend

Maps short keys to glyph definitions — simple names, composite arrays, gradients, player colours, text glyphs, etc. See [Glyphs](/renderer/glyphs/).

*Example games:* [Alfred's Wyke](https://play.abstractplay.com/game/wyke), [Advanced Slither](https://play.abstractplay.com/game/slither)

## Areas

Specialized sections, usually below the board, to provide additional information: piece stashes, button bars, Homeworlds stashes, polyomino holding areas, and more.

*Example games:* [Volcano](https://play.abstractplay.com/game/volcano), [Arimaa](https://play.abstractplay.com/game/arimaa), [Homeworlds](https://play.abstractplay.com/game/homeworlds)

## Annotations

Drawn above pieces: move arrows, enter/exit markers, dots, outlines, etc. See [Annotations](/renderer/annotations/).

*Example games:* [Arimaa](https://play.abstractplay.com/game/arimaa), [Volcano](https://play.abstractplay.com/game/volcano)

## Example

*Example games:* [Arimaa](https://play.abstractplay.com/game/arimaa)

{% renderWidget "samples/pieces-simple.json" %}

[Open in playground](https://renderer.dev.abstractplay.com)
