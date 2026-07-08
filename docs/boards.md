# Boards

Board `style` selects the topology. Width, height, markers, and stroke options further customize appearance.

## Square grids

### `squares`

{% renderWidget "samples/board-squares.json" %}

### `squares-checkered`

{% renderWidget "samples/board-squares-checkered.json" %}

### `squares-beveled`

{% renderWidget "samples/board-squares-beveled.json" %}

### `squares-stacked`

{% renderWidget "samples/board-squares-stacked.json" %}

### `squares-diamonds`

{% renderWidget "samples/board-squares-diamonds.json" %}

### `heightmap-squares`

Square grid with per-cell elevation for the [isometric](/renderer/engines/) renderer.

{% renderWidget "samples/board-heightmap-squares.json" %}

## Vertex boards

### `vertex`

{% renderWidget "samples/board-go.json" %}

Go uses a vertex board with automatic star points. Disable with the `hide-star-points` option.

### `vertex-cross`

{% renderWidget "samples/board-vertex.json" %}

### `vertex-fanorona`

{% renderWidget "samples/board-vertex-fanorona.json" %}

## Hex grids

### `hex-slanted`

{% renderWidget "samples/board-hexslanted.json" %}

### `hex-odd-p`

Pointy-topped hexes with odd-row offset.

{% renderWidget "samples/board-hex-odd-p.json" %}

### `hex-even-p`

{% renderWidget "samples/board-hex-even-p.json" %}

### `hex-odd-f`

Flat-topped hexes with odd-row offset.

{% renderWidget "samples/board-hex-odd-f.json" %}

### `hex-even-f`

{% renderWidget "samples/board-hex-even-f.json" %}

### `hex-of-hex`

{% renderWidget "samples/board-hexhex.json" %}

Top half only (`half: "top"`):

{% renderWidget "samples/board-hexhex-half-top.json" %}

Bottom half only (`half: "bottom"`):

{% renderWidget "samples/board-hexhex-half-bottom.json" %}

Alternating symmetry (`alternatingSymmetry: true`):

{% renderWidget "samples/board-hexhex-alternating.json" %}

### `hex-of-tri`

{% renderWidget "samples/board-hextri.json" %}

### `hex-of-tri-f`

{% renderWidget "samples/board-hextrif.json" %}

### `hex-of-cir`

{% renderWidget "samples/board-hexcir.json" %}

## Triangle and specialty tilings

### `rect-of-tri`

{% renderWidget "samples/board-rectTri.json" %}

### `triangles-stacked`

{% renderWidget "samples/board-triangles-stacked.json" %}

### `bent-tri`

{% renderWidget "samples/board-bent-tri.json" %}

### `snubsquare`

{% renderWidget "samples/board-snubsquare.json" %}

### `snubsquare-cells`

{% renderWidget "samples/board-snubsquare-cells.json" %}

### `onyx`

{% renderWidget "samples/board-onyx.json" %}

### `pentagonal`

{% renderWidget "samples/board-pentagonal.json" %}

### `pentagonal-bluestone`

{% renderWidget "samples/board-pentagonal-bluestone.json" %}

### `star`

{% renderWidget "samples/board-star.json" %}

## Cairo tilings

### `cairo-collinear`

{% renderWidget "samples/boards-cairo-collinear.json" %}

### `cairo-catalan`

{% renderWidget "samples/boards-cairo-catalan.json" %}

## Conical and pyramid hex

### `conical-hex`

{% renderWidget "samples/board-conicalHex.json" %}

### `conical-hex-narrow`

{% renderWidget "samples/board-conical-hex-narrow.json" %}

### `pyramid-hex`

{% renderWidget "samples/board-pyramidHex.json" %}

## Circular boards

### `circular-wheel`

{% renderWidget "samples/board-wheel.json" %}

### `circular-cobweb`

{% renderWidget "samples/board-circular.json" %}

### `circular-moon`

{% renderWidget "samples/board-moon.json" %}

## Sowing / Mancala

### `sowing`

{% renderWidget "samples/boards-sowing-pips.json" %}

### `sowing-round`

{% renderWidget "samples/boards-sowing-round.json" %}

## ConHex

### `conhex-dots`

{% renderWidget "samples/boards-conhex-dots.json" %}

### `conhex-cells`

{% renderWidget "samples/boards-conhex-cells.json" %}

## DVGC

### `dvgc`

{% renderWidget "samples/boards-dvgc.json" %}

### `dvgc-checkered`

{% renderWidget "samples/board-dvgc-checkered.json" %}

## Pegboard

### `pegboard`

{% renderWidget "samples/boards-pegboard.json" %}

## Other

### `other`

Placeholder board style for specialized renderers (such as `tree-pyramid`) where no grid is drawn.

{% renderWidget "samples/board-other.json" %}

## Blocking cells

Irregular shapes by blocking outer cells:

{% renderWidget "samples/blocking.json" %}

Full list of board styles: [Schema reference — board styles](/renderer/schema-reference/#board-styles).

[Open in playground](https://renderer.dev.abstractplay.com)
