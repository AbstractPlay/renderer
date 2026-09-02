# Boards

Board `style` selects the topology. Width, height, markers, and stroke options further customize appearance.

## Square grids

### `squares`

*Example games:* [Cifra](https://play.abstractplay.com/games/cifra), [Realm](https://play.abstractplay.com/games/realm)

{% renderWidget "samples/board-squares.json" %}

### `squares-checkered`

*Example games:* [Amazons](https://play.abstractplay.com/games/amazons), [Arimaa](https://play.abstractplay.com/games/arimaa)

{% renderWidget "samples/board-squares-checkered.json" %}

### `squares-beveled`

*Example games:* [Blockade](https://play.abstractplay.com/games/blockade), [Boxes](https://play.abstractplay.com/games/boxes)

{% renderWidget "samples/board-squares-beveled.json" %}

### `squares-stacked`

*Example games:* [Akron](https://play.abstractplay.com/games/akron), [Margo](https://play.abstractplay.com/games/margo)

{% renderWidget "samples/board-squares-stacked.json" %}

### `squares-diamonds`

*Example games:* [Alta](https://play.abstractplay.com/games/alta), [Tessella](https://play.abstractplay.com/games/tessella)

{% renderWidget "samples/board-squares-diamonds.json" %}

### `heightmap-squares`

Square grid with per-cell elevation for the [isometric](/renderer/engines/) renderer.

{% renderWidget "samples/board-heightmap-squares.json" %}

## Vertex boards

### `vertex`

*Example games:* [Go](https://play.abstractplay.com/games/go), [Asli](https://play.abstractplay.com/games/asli)

{% renderWidget "samples/board-go.json" %}

Go uses a vertex board with automatic star points. Disable with the `hide-star-points` option.

### `vertex-cross`

*Example games:* [Fabrik](https://play.abstractplay.com/games/fabrik), [Shape Chess](https://play.abstractplay.com/games/shapechess)

{% renderWidget "samples/board-vertex.json" %}

### `vertex-fanorona`

*Example games:* [Fanorona](https://play.abstractplay.com/games/fanorona), [Query](https://play.abstractplay.com/games/query)

{% renderWidget "samples/board-vertex-fanorona.json" %}

## Hex grids

### `hex-slanted`

*Example games:* [Hex](https://play.abstractplay.com/games/hex), [Lox](https://play.abstractplay.com/games/lox)

{% renderWidget "samples/board-hexslanted.json" %}

### `hex-odd-p`

*Example games:* [Exxit](https://play.abstractplay.com/games/exxit), [Storisende](https://play.abstractplay.com/games/storisende)

{% renderWidget "samples/board-hex-odd-p.json" %}

### `hex-even-p`

*Example games:* [Chase](https://play.abstractplay.com/games/chase), [Streetcar Suburb](https://play.abstractplay.com/games/streetcar)

{% renderWidget "samples/board-hex-even-p.json" %}

### `hex-odd-f`

*Example games:* [Atoll](https://play.abstractplay.com/games/atoll)

{% renderWidget "samples/board-hex-odd-f.json" %}

### `hex-even-f`

*Example games:* [Tintas](https://play.abstractplay.com/games/tintas)

{% renderWidget "samples/board-hex-even-f.json" %}

### `hex-of-hex`

*Example games:* [Crosshairs](https://play.abstractplay.com/games/crosshairs), [Havannah](https://play.abstractplay.com/games/havannah)

{% renderWidget "samples/board-hexhex.json" %}

Top half only (`half: "top"`):

*Example games:* [Basalt](https://play.abstractplay.com/games/basalt), [Y](https://play.abstractplay.com/games/y)

{% renderWidget "samples/board-hexhex-half-top.json" %}

Bottom half only (`half: "bottom"`):

{% renderWidget "samples/board-hexhex-half-bottom.json" %}

Alternating symmetry (`alternatingSymmetry: true`):

*Example games:* [Churn](https://play.abstractplay.com/games/churn), [Squirm](https://play.abstractplay.com/games/squirm)

{% renderWidget "samples/board-hexhex-alternating.json" %}

### `hex-of-tri`

*Example games:* [Accasta](https://play.abstractplay.com/games/accasta), [Yavalath](https://play.abstractplay.com/games/yavalath)

{% renderWidget "samples/board-hextri.json" %}

### `hex-of-tri-f`

Same as `hex-of-tri` but pieces are placed on the faces of the triangles.

{% renderWidget "samples/board-hextrif.json" %}

### `hex-of-cir`

{% renderWidget "samples/board-hexcir.json" %}

## Triangle and specialty tilings

### `rect-of-tri`

{% renderWidget "samples/board-rectTri.json" %}

### `triangles-stacked`

{% renderWidget "samples/board-triangles-stacked.json" %}

### `bent-tri`

*Example games:* [Y](https://play.abstractplay.com/games/y)

{% renderWidget "samples/board-bent-tri.json" %}

### `snubsquare`

*Example games:* [Cephalopod](https://play.abstractplay.com/games/ceph)

{% renderWidget "samples/board-snubsquare.json" %}

### `snubsquare-cells`

{% renderWidget "samples/board-snubsquare-cells.json" %}

### `onyx`

*Example games:* [Onyx](https://play.abstractplay.com/games/onyx)

{% renderWidget "samples/board-onyx.json" %}

### `pentagonal`

{% renderWidget "samples/board-pentagonal.json" %}

### `pentagonal-bluestone`

*Example games:* [Bluestone](https://play.abstractplay.com/games/bluestone)

{% renderWidget "samples/board-pentagonal-bluestone.json" %}

### `star`

{% renderWidget "samples/board-star.json" %}

## Cairo tilings

### `cairo-collinear`

*Example games:* [Cairo Corridor](https://play.abstractplay.com/games/ccorridor)

{% renderWidget "samples/boards-cairo-collinear.json" %}

### `cairo-catalan`

{% renderWidget "samples/boards-cairo-catalan.json" %}

## Conical and pyramid hex

### `conical-hex`

*Example games:* [Conect](https://play.abstractplay.com/games/conect)

{% renderWidget "samples/board-conicalHex.json" %}

### `conical-hex-narrow`

*Example games:* [Conect](https://play.abstractplay.com/games/conect)

{% renderWidget "samples/board-conical-hex-narrow.json" %}

### `pyramid-hex`

{% renderWidget "samples/board-pyramidHex.json" %}

## Circular boards

### `circular-wheel`

Legacy interlaced style: pieces may be placed on **vertices** (even rows) or **space** centroids (odd rows). Row 0 is the outermost vertex ring; the final row is the centre point when `circular-inner` is 0. New games should prefer the explicit styles below.

{% renderWidget "samples/board-wheel.json" %}

### `circular-wheel-spaces`

Spaces only — one row per ring. Row 0 is the outer ring, row `height - 1` is the inner ring. Supports `backFill`, `blocked`, `columnLabels`, and `circular-inner`.

### `circular-wheel-vertices`

Vertices only — intersection points at each ring radius. Row 0 is the outer ring. Supports `backFill`, `blocked`, and `columnLabels`.

### `circular-wheel-spaces-checkered`

Like `circular-wheel-spaces` with alternating light/dark sector fills (no flood markers required). Optional `startLight` controls which ring/column parity is light.

{% renderWidget "samples/board-wheel-annular-chess.json" %}

### `circular-cobweb`

*Example games:* [Adere](https://play.abstractplay.com/games/agere)

{% renderWidget "samples/board-circular.json" %}

### `circular-moon`

*Example games:* [Moon Squad](https://play.abstractplay.com/games/moonsquad), [Adere](https://play.abstractplay.com/games/agere)

{% renderWidget "samples/board-moon.json" %}

### `fractured-flat`

Hand-authored fractured polygon board (45 cells). **Rows** are size tiers (triangles, quads, pentagons, hexagons). **Columns** sweep **clockwise from north** around the board center: each cell is ordered by the bearing of its first corner encountered by that sweep (minimum vertex bearing). Row 0 has 24 triangles, row 1 has 15 quads, row 2 has 5 pentagons, row 3 has 1 hexagon.

Index labels use a **tier letter** and **1-based column** (`A1` = row 0 col 0, `B1` = row 1 col 0, etc.).

{% renderWidget "samples/board-fractured-flat.json" %}

{% renderWidget "samples/board-fractured-flat-index.json" %}

## Sowing / Mancala

### `sowing`

*Example games:* [Bao](https://play.abstractplay.com/games/bao), [Diffusion](https://play.abstractplay.com/games/diffusion)

{% renderWidget "samples/boards-sowing-pips.json" %}

### `sowing-round`

*Example games:* [Rincala](https://play.abstractplay.com/games/rincala)

{% renderWidget "samples/boards-sowing-round.json" %}

## ConHex

### `conhex-dots`

*Example games:* [ConHex](https://play.abstractplay.com/games/conhex)

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

*Example games:* [Connections](https://play.abstractplay.com/games/connections), [Twixt](https://play.abstractplay.com/games/twixt)

{% renderWidget "samples/boards-pegboard.json" %}

## Other

### `other`

Placeholder board style for specialized renderers (such as `tree-pyramid`) where no grid is drawn.

*Example games:* [Siege of Jacynth](https://play.abstractplay.com/games/siegeofj)

{% renderWidget "samples/board-other.json" %}

## Blocking cells

Irregular shapes by blocking outer cells:

{% renderWidget "samples/blocking.json" %}

Full list of board styles: [Schema reference — board styles](/renderer/schema-reference/#board-styles).