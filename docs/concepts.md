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

### Domino tiles in a `pieces` area

Domino pairing is **area-only**. Board placement continues to use separate half legends in adjacent cells (see [Glyphs — domino-style blocks](/renderer/glyphs/#isometric-face-overlays)).

In a `pieces` area, an entry may be a **domino tile ref** that fuses two existing legend keys into one flat 2:1 tile:

```json
{
  "type": "pieces",
  "label": "Your hand",
  "pieces": [
    { "domino": ["DomL35", "DomR35"], "id": "t0" }
  ]
}
```

- `domino` — legend keys for the west (left) and east (right) ends, in that order. Each end is styled independently in `legend` (glyphs, colours, opacity, etc.). The renderer does not interpret tile contents.
- `id` — optional stable handle for click payloads (defaults to the tile index).

Each end is individually clickable. The click handler receives `boardClick(-1, -1, piece)` with `piece` encoded as:

`_domino_{indexOrId}_{leftKey}_{rightKey}_{L|R}`

For example, clicking the left end of tile `t0` whose ends are `DomL35` and `DomR35` returns `_domino_t0_DomL35_DomR35_L`.

Hand tiles use the same board cell size and `0.85` placement scale as pieces on `square*` boards, so legend `scale` values that compensate for board downscaling should look consistent between the board and the hand.

Rows wrap at the board width in **cells** (each domino tile counts as two cells and is never split across rows).

{% renderWidget "samples/niche-domino-hand.json" %}

## Annotations

Drawn above pieces: move arrows, enter/exit markers, dots, outlines, etc. See [Annotations](/renderer/annotations/).
