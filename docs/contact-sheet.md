# Contact sheet

Every piece name you can use in `legend` `name` fields comes from a **glyph sheet** in the renderer. This reference lists them all, grouped by sheet.

The file below is checked into `docs/contact-sheet.svg` and updated manually when sheets change.

<object data="/renderer/contact-sheet.svg" type="image/svg+xml" class="contact-sheet">
  <img src="/renderer/contact-sheet.svg" alt="Renderer glyph contact sheet" />
</object>

<p class="contact-sheet-fallback"><a href="/renderer/contact-sheet.svg">Open contact sheet (SVG)</a></p>

## Glyph sheets

The renderer loads sheets in order and uses the first match for a given `name`. Default sheets (unless overridden via render options):

| Sheet | Typical contents |
| --- | --- |
| `core` | Generic pieces (`piece`, `piece-square`, `meeple`, `cube`, arrows, markers, …) |
| `dice` | Dice faces and bodies |
| `dominoes` | Domino tiles |
| `looney` | Looney Pyramids-style pieces |
| `piecepack` | Piecepack tiles and coins |
| `chess` | Chess and checkers pieces |
| `streetcar` | Streetcar game artwork |
| `nato` | NATO symbol set |
| `decktet` | Decktet card faces |
| `arimaa` | Arimaa pieces |
| `experimental` | In-progress or niche artwork |

Games that need sheets beyond the defaults pass a `sheets` array in render options.

To add a new piece to the renderer, see [Adding pieces](/renderer/adding-pieces/).
