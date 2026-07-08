# Boards

Board `style` selects the topology. Width, height, markers, and stroke options further customize appearance.

## Square and vertex

{% renderWidget "samples/board-go.json" %}

Go uses a vertex board with automatic star points. Disable with the `hide-star-points` option.

{% renderWidget "samples/board-vertex.json" %}

## Hex grids

{% renderWidget "samples/board-hexfield.json" %}

{% renderWidget "samples/board-hexhex.json" %}

## Snubsquare and specialty

{% renderWidget "samples/board-snubsquare.json" %}

## Sowing / Mancala

{% renderWidget "samples/boards-sowing-pips.json" %}

## Circular

{% renderWidget "samples/board-circular.json" %}

## ConHex

{% renderWidget "samples/boards-conhex-dots.json" %}

## Blocking cells

Irregular shapes by blocking outer cells:

{% renderWidget "samples/blocking.json" %}

Full list of board styles: [Schema reference — board styles](../schema-reference/#board-styles).

[Open in playground](https://renderer.dev.abstractplay.com)
