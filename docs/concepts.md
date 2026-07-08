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

## Pieces

Usually a string grid (rows separated by `\n`) where each character maps to a `legend` entry that represents a piece on the board. Specialized renderers use arrays or structured objects instead. See [Engines](/renderer/engines/).

## Legend

Maps short keys to glyph definitions — simple names, composite arrays, gradients, player colours, text glyphs, etc. See [Glyphs](/renderer/glyphs/).

## Areas

Specialized sections, usually below the board, to provide additional information: piece stashes, button bars, Homeworlds stashes, polyomino holding areas, and more.

## Annotations

Drawn above pieces: move arrows, enter/exit markers, dots, outlines, etc. See [Annotations](/renderer/annotations/).
