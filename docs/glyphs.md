# Glyphs

The `legend` maps keys used in `pieces` to visual glyphs. Player pieces should use the `player` property (or `colour` with a player number) so user colour settings apply.

## Simple glyphs

{% renderWidget "samples/pieces-simple.json" %}

## Composite glyphs

Layer multiple glyphs for stacked appearances:

{% renderWidget "samples/pieces-layered.json" %}

## Gradients

{% renderWidget "samples/pieces-gradients.json" %}

## Rotated glyphs

{% renderWidget "samples/pieces-rotated.json" %}

## Stacked pieces (`stacking-offset`)

{% renderWidget "samples/pieces-stacked.json" %}

## Dice and text

{% renderWidget "samples/pieces-dice.json" %}

Text glyphs use `orientation: "vertical"` so labels stay legible when the board rotates.

## Glyph options

Common legend object properties:

- `name` — glyph sheet id (see renderer contact sheet)
- `text` — render arbitrary short text as a glyph
- `player` / `colour` — fill colour
- `scale`, `opacity`, `rotate`, `nudge`, `orientation`

[Open in playground](https://renderer.dev.abstractplay.com) · [Schema reference — legend](../schema-reference/)
