# Glyphs

The `legend` maps keys used in `pieces` to visual glyphs. Player pieces should use the `player` property (or `colour` with a player number) so user colour settings apply.

## Simple glyphs

*Example games:* [Arimaa](https://play.abstractplay.com/games/arimaa), [Go](https://play.abstractplay.com/games/go)

{% renderWidget "samples/pieces-simple.json" %}

## Composite glyphs

Layer multiple glyphs for stacked appearances:

*Example games:* [Alfred's Wyke](https://play.abstractplay.com/games/wyke), [Cannon](https://play.abstractplay.com/games/cannon)

{% renderWidget "samples/pieces-layered.json" %}

## Gradients

{% renderWidget "samples/pieces-gradients.json" %}

## Rotated glyphs

*Example games:* [Crosshairs](https://play.abstractplay.com/games/crosshairs), [Pikemen](https://play.abstractplay.com/games/pikemen)

{% renderWidget "samples/pieces-rotated.json" %}

## Stacked pieces (`stacking-offset`)

*Example games:* [Abande](https://play.abstractplay.com/games/abande), [Accasta](https://play.abstractplay.com/games/accasta)

{% renderWidget "samples/pieces-stacked.json" %}

## Dice and text

*Example games:* [Cephalopod](https://play.abstractplay.com/games/cephalopod), [Cubeo](https://play.abstractplay.com/games/cubeo), [Boom & Zoom](https://play.abstractplay.com/games/boom)

{% renderWidget "samples/pieces-dice.json" %}

Text glyphs use `orientation: "vertical"` so labels stay legible when the board rotates.

## Glyph options

Common legend object properties:

- `name` — glyph sheet id (see renderer contact sheet)
- `text` — render arbitrary short text as a glyph
- `player` / `colour` — fill colour
- `scale`, `opacity`, `rotate`, `nudge`, `orientation`

[Schema reference — legend](/renderer/schema-reference/)
