# Renderer documentation

The Abstract Play renderer turns a JSON **render representation** into SVG board images. Every game implements `render()` to produce this JSON; the front end and designer pass it to `APRender.render()`.

**Schema version:** see [Schema reference](schema-reference/) (auto-generated from `schema.json`).

## Quick links

- [Concepts](concepts/) — board, pieces, legend, areas, annotations
- [Glyphs](glyphs/) — piece appearance
- [Boards](boards/) — board styles and topology
- [Formatting](formatting/) — labels, rotation, tiling
- [Markers](markers/) — board decorations under pieces
- [Annotations](annotations/) — move highlights
- [Engines](engines/) — specialized renderers
- [Schema reference](schema-reference/) — full enum/property listing

## Full playground

For advanced controls (colour context, rotation presets, settings JSON), use the standalone playground — it is not part of this docs site:

**[renderer.dev.abstractplay.com](https://renderer.dev.abstractplay.com)**

## Interactive examples on this site

Many pages include embedded editors where you can tweak JSON and see the SVG update live. For the full sample library, open the playground above.

*Last verified against schema in `src/schemas/schema.json` on the develop branch.*
