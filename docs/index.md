# Renderer documentation

The Abstract Play renderer turns a JSON **render representation** into SVG board images. Every game implements `render()` to produce this JSON; the front end and designer pass it to `APRender.render()`.

**Schema version:** see [Schema reference](/renderer/schema-reference/) (auto-generated from `schema.json`).

## Quick links

- [Concepts](/renderer/concepts/) — board, pieces, legend, areas, annotations
- [Boards](/renderer/boards/) — board styles and topology
- [Glyphs](/renderer/glyphs/) — piece appearance
- [Formatting](/renderer/formatting/) — labels, rotation, tiling
- [Markers](/renderer/markers/) — board decorations under pieces
- [Annotations](/renderer/annotations/) — move highlights
- [Engines](/renderer/engines/) — specialized renderers
- [Schema reference](/renderer/schema-reference/) — full enum/property listing

## Full playground

For advanced controls (colour context, rotation presets, settings JSON), use the standalone playground — it is not part of this docs site:

**[renderer.dev.abstractplay.com](https://renderer.dev.abstractplay.com)**

## Interactive examples on this site

Many pages include embedded editors where you can tweak JSON and see the SVG update live. For the full sample library, open the playground above.

*Last verified against schema in `src/schemas/schema.json` on the develop branch.*
