# Change log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Since the `1.0.0-beta` release, the version in `package.json` has stayed at `1.0.0-beta`. CI publishes tarballs as `1.0.0-ci-<GitHub Actions run id>.0` (see `.github/workflows/node-dev.js.yml` and `node-prod.js.yml`). Entries below are grouped by theme and approximate ship window; the exact CI build is whichever workflow run produced the artifact you installed.

## [1.0.0-ci] - 2026-10-04

### Added

- **Glyph paint slot audit** — `runGlyphPaintAudit` / `npm run glyph-paint-audit` flags contact glyphs whose fill or stroke stays off player colour after uniform `paint.fill`, `paint.border`, and `paint.detail` (skips `paintMode: fixed`, procedural orbs, and ink on optional catalog slots outside those three). Runs on `regenerate-glyphs` / `verify-glyphs` and in `npm test`.
- [Designing sheet glyphs](docs/designing-glyphs.md) contributor guide; showcase samples for border, duotone chess, and dice pip paint.

### Fixed

- **Legacy glyph `opacity` without `colour`:** `fill-opacity` is applied to fill-channel slot bindings on authored defaults (regression from slot paint migration).
- **Procedural orbs (`orb`–`orb3`):** legacy `opacity` on `paint.fill` is applied as `fill-opacity` on the shaded sphere after gradients are built (was dropped when `fill` was removed from post-shading slot paint).

### Changed

- **Sheet glyph paint:** Name legend entries may use optional `paint` with per-slot colours (`fill`, `border`, and where the glyph defines them, `detail`; see the generated [Glyph paint slots](docs/glyph-slots.md) reference). Legacy `colour` and `colour2` still apply and map to the same slots (`colour2` defaults to `border`; on dice and orca, `colour2` maps to `detail`). Core disc-like tokens, chess, arimaa, experimental duotone pieces, dice faces, orbs (`orb`–`orb3`), and piecepack (disc-frame numbers and simple suits; ink-border coin and compound suits; fill+detail tile back and void) and domino pip tiles (`fill` only, default `#000`) and NATO symbols (frame `fill` + `border`) and Looney pyramids (disc-frame; `*-3D` inner `fill` + outer `border` strokes, defaults white/black) and Decktet ranks/court/crown/pawn (`fill` only, default black) and suit glyphs (retained suit `fill` defaults plus black `border` ink) and Gnostica glyphs (`fill` for player areas, `detail` for legacy `colour2` wedges, black `border` for outlines and decorative ink) and Streetcar Suburb cubes and house (`fill` for cube faces, `#4d4d4d` `border` for outlines and icon ink) and the remaining core contact-sheet glyphs use slot bindings and renderer-side procedural sphere shading; `orca` uses `fill` and `detail`. CI runs `verify-glyphs` so the contact sheet, catalog, and docs stay aligned with sheet sources. Text legend layers keep optional `colour` only (not `paint`). After editing sheet glyphs locally, run `npm run regenerate-glyphs`.
- In-repo **docs samples**, **playground** catalog, and author docs now use **`paint`** on sheet legend glyphs; `npm run migrate-glyph-paint` converts external JSON (`--write` / `--verify`). See [Designing sheet glyphs](docs/designing-glyphs.md) and updated [Glyphs](docs/glyphs.md).
- Normalized `localStash` so semantics are consistent across games (bottom→top columns, spacing from legend glyph names, silhouette base alignment for `pyramid-up-*-3D`).
- Sheet glyph styling is cached by paint fingerprint; layer `opacity` is applied on the placed instance, not baked into the shared symbol.
- **Sheet layout:** glyph art lives under `src/sheets/contact/`; slot registry helpers and `glyph-slots.catalog.json` live under `src/sheets/registry/`. Public `sheets` map and `defineGlyph` re-exports remain on `src/sheets/index.ts`.

### Deprecated

- **Render JSON schema:** Legend **`colour`** and **`colour2`** on sheet **`name`** glyphs are explicitly marked deprecated in favour of **`paint`** (`colour` → `paint.fill`; `colour2` → `paint.border` or, where the glyph catalog specifies, `paint.detail`). Behaviour is unchanged for now; new game JSON should use **`paint`** only. Text legend layers still use **`colour`** (not deprecated).

## [1.0.0-ci] - 2026-09-30

### Added

- **Board chrome:** `hexMinMaxGrid` registry group — Customize may swap [`hex-of-hex`](docs/boards.md) and [`hex-of-tri`](docs/boards.md) (shared `minWidth` / `maxWidth` string grid); `hex-of-tri-f` excluded.

### Changed

- **Board chrome:** `isBoardStyleCustomizationEligible` vs `isBoardFieldChromeEligible` — style swaps remain registry-gated; `labelScale`, strokes, `render.options`, and glyphmap apply on any `boardBasic` board (including pegboard and hex apex boards).

## [1.0.0-ci] - 2026-09-28

### Added

- `renderSheetGlyph`, `renderLegendGlyph`, and `renderInlineGlyph` for sidebar-style inline icons, including full `LegendEntry` support (composite glyph arrays, polymatrix, isometric `isoPiece` on `board: null` without drawing a playfield).
- Polymatrix legend defs set explicit `width`/`height` so inline icons scale like composite glyphs.
- Playground sample `glyph-inline-composite` (decktet-style composite on `board: null`).
- Experimental glyph sheet entries and contact-sheet tooling updates; fairy-chess and related chess glyph retagging.
- `static` pulse styling for annotations (including 2× pulse).
- Relative glyph nudges that stay consistent across board rotation.
- Optional text labels above/below pieces in the `pieces` area; local playground serving for development.
- `blocked` support on the `stacking3D` renderer.
- Optional legend `glyph` on `buttonBar` buttons, anchored to the left or right (`glyphPosition` `prefix` or `suffix`) while the label stays centred; `label` is optional when `glyph` is set (at least one required at render time); optional `glyphScale` (default `0.76`) sets icon size within the reserved strip.
- **`localStash` on the default renderer:** pyramid stash columns (`areas[]` with `type: "localStash"`) render below the board after `pieces` areas, using the same wrap model as hand bars (`Math.floor(box.width / cellsize)` stack columns per row, overridable with optional area `width` and `spacing`).
- **`RendererBase.localStashArea()`** shared placement for default, `stacking-3D`, and `stacking-expanding` renderers; `buildLocalStashRows` in `src/common/localStashArea.ts` and coverage in `test/localStashArea.test.ts`.

### Changed

- First phase of a `renderGlyph` refactor (layout, sizing, and colour handling).
- **Board chrome:** central registry for per-board-style chrome (labels, borders, fill ordering); `labelScale` and structured label placement; loosened which board styles accept markers, labels, and related features; pegboard and some legacy styles removed from the chrome registry.
- Thicker default outer border on square boards; fixes for outer-border and label regressions tied to chrome work.
- NATO infantry-special glyph text placement.
- **`areaVolcanoStash` schema:** optional `width` and `spacing`; description no longer limited to `stacking-expanding` only.
- **Stacking renderers:** captured / pool stashes use `localStashArea` (gained board-width wrapping where many stack columns are present).

### Fixed

- Pegboard customization registry lookup.
- Contact sheet generation after `svgdom` dependency updates; dependency pin and test adjustments.
- Solid boat glyph and several experimental-glyph viewBoxes.
- DokuWiki bundle prefix handling.

## [1.0.0-ci] - 2026-08-30

### Added

- Full **ESM** package (`"type": "module"`, NodeNext `tsc` emit); webpack removed.
- Playground moved to `playground/` with **Vite** (`npm run playground`, `dist-dev` / `dist-prod`); samples loaded from `test/fixtures/playground-samples.json`.
- **Playwright** cross-browser smoke tests that render every playground snippet in Chromium, Firefox, and WebKit (structural SVG checks). See [Playground samples](/renderer/playground-samples/).
- Playground catalog in `test/fixtures/playground-samples.json`; samples such as `niche-areas-track` (fractured-flat + bottom score track).
- **DokuWiki** plugin and renderer customization hooks; optional **glyph definition caching** for faster reloads.
- **References** framework with CoL and Scribe reference areas; multi-side reference rendering.
- `fractured-flat` board style and `track` area for score/progress strips along board edges.
- Spaced square grids: new row/column coordinate format.
- Gnostica glyph sheet; Shogi and Janggi pieces; `piece-square-dashed`.
- Structured board labels (phase 1); conhex board rotation enabled.
- Automated contact-sheet generation and expanded glyph-authoring documentation.

### Changed

- Node.js 24 in CI; PR-specific workflow; docs deploy triggered from CI relay jobs.
- Major **docs** site pass under `docs/` with expanded board snippets, sample games, and playground URL-loading notes.
- Wheel-style circular board updates.

### Fixed

- ESM/CJS consumption and pack layout issues; extensive test hardening for dual module formats.
- Board fill ordering when combined with marker fills; Streetcar Suburb regression.
- Firefox track display in fractured-flat layouts; flipped glyphs combined with rotation.
- Playground CSP and snippet errors.

## [1.0.0-ci] - 2026-06-30

### Added

- **Isometric renderer** maturation: coloured multi-face cubes, cones and pyramids, edge markers, hex lintels, board labels, working key area, projection and shading options, overlay glyphs on isometric pieces (including cube sides), mixed pattern/colour stacks, and domino-style extensions to the `pieces` area.
- `bentTri` and `star` board styles; `domino` glyph sheet and half-domino tile; `piece-dashed`.
- **Tree pyramid** experimental renderer with `rule` annotation support.
- `labelGrid` for per-cell labels; fractional coordinates on annotations and on line/dot markers.
- **Board context and palettes:** global vs game-specific colour context, `custom` colour functions, expanded `backFill` (`full` vs `board`), rounded board-fill polygons, `null` palette entries, glyph `font` control, exported root `sheets`, typed `renderGlyph` colour callbacks.
- `rect-of-tri`, `hex-of-tri-f`, and related board styles; `no-border` extended to rect-of-tri edges.
- Playground examples for new boards; autocontrast for colourless text glyphs; second colour on several core glyphs (dice, horse, chariot, cog, triangle-dot).

### Changed

- Board generation refactored out of the base renderer class into per-style modules.
- Glyphmap entries can scale mapped glyphs; opacity applied only to player fill/stroke (transparent pyramids still show pips).
- Enter/exit annotations can draw background fills on the board.

### Fixed

- Long-standing flood-fill marker bug (with known game-side follow-ups); `resolveColour` and pieces-area background handling.
- Lighten/darken behaviour for white and black; BentTri layering; multi-face cube rotation and contact shadows.
- Isometric rotation and dots render order; mixing isometric with flat legend entries.

## [1.0.0-ci] - 2025-12-31

### Added

- `flipx` / `flipy` on glyphs; `bestContrast` helper; `compassRose` area; arrow, chevron, star, katana, castle, owl, cog, and Kachit arrow glyphs.
- **Arimaa** glyph sheet; **Amazons** brick glyphs; expanded dice (d13–d16, Cubeo variants, empty d6).
- **Pentagonal** boards and pentagonal piece; **duotone yinyang**; initial experimental **tree pyramid** renderer.
- Pattern flood markers; colour functions in gradient stops; nested `colourFunc` resolution throughout.
- `labelGrid` and freespace `pieces` area support; `prefix` option to avoid SVG id collisions in embedded renders.
- Round **mancala** board (stacking-offset); expanded **Entropy** board sizes 5–6.

### Changed

- Default palette expanded to 12 colours; updated color-blind palette.
- Build output minification; `npm pack` included in build script.
- Buffer zones: optional separation, custom colours, and restored click sensitivity on vertex boards.

### Fixed

- Memory leaks in `renderStatic` / `renderGlyph` (with follow-up reverts and final fixes); `addPrefix` regex escaping.
- Overlapping dot markers; Safari issues with `hanging` text baselines in labels and pieces areas.
- Pieces-area rotation; `renderStatic` edge cases.

## [1.0.0-ci] - 2024-12-31

### Added

- **Decktet** glyph sheet; **duotone** pieces; Trax glyph.
- `line` annotation; `dasharray` on line markers; `outline` marker extended to square boards.
- `circular-wheel` board; customizable enter/exit shapes; `spacing` on `pieces` area.
- `stacking3D` pieces area; `lighten` on halo markers; `_context*` stroke colours and improved `backFill` polygons (convex hull / turf-backed).
- **Snubsquare-cells**, **Onyx**, **circular-moon**, **squares-diamonds** board styles; **cube** glyph.
- **NATO** unit glyph set; **DVGC** board (+ checkered variant); traditional chess glyphs; orca/humpback glyphs; `reserves` area for DVGC.
- **Isometric renderer** (initial release): hex-of-hex/cir boards, decimal height, annotations and markers in isometric space, custom annotation hooks.
- `scrollBar` area; `squares-stacked` board; `squares-beveled` / vertex-fanorona on stacking-offset for Designer use.
- `polyomino` renderer and area; **pegboard**; **cairo-collinear** and **cairo-orthogonal** boards; **multicell** experimental renderer.
- `compass`-style colour **contexts** (e.g. dark mode) via `_context_*` colour strings; `labelColour` vs gridline `strokeColour`; `borders` context for glyphs.
- `triangles-stacked` board; hex matrix glyphs; automatic star points on square vertex boards; `pulse` on flood markers.
- `no-piece-click` option; opacity on edge markers; glyph annotation type.

### Changed

- **Arbitrary board rotation** (beyond 180°) with rotated click coordinates; two-pass stacking-offset rendering; text glyphs default to vertical; `null` rotation disables glyph rotation.
- JSON Schema restructured with named types and `$defs`; linear gradients; consolidated colour resolution; removed legacy `player` colour attribute from schema.
- `hexFill` removed in favour of expanded `backFill` / flood behaviour; enter/exit annotations follow cell outlines on polygon boards.
- Homeworlds: progressive/partial systems, diagram `hw-system-only`, 3–4 player fixes, Phutball compatibility.

### Fixed

- Blocked cells on square, vertex, hex-slanted, and hex-of-tri boards; flood fills behind gridlines; WebKit/Safari hex flood fills.
- Piecepack and snubsquare layout; Firefox glyph issues; move annotation `style` vs `dashed` precedence.

## [1.0.0-ci] - 2024-06-30

### Added

- **ConHex** and **conical-hex** / **pyramidHex** board families; **hex-slanted** boards with edge markers.
- **Sowing** board renderers (square and hex pits, numerals, deltas, outline marker).
- **Flood** markers and expanded `hexFill`.
- FNAP glyphs; meeple glyph; ring glyphs; plane glyph; hline/vline/dline glyphs.
- `swap-labels`; `hide-labels-half`; `shorten` on line markers; `fences` shorthand marker.
- `clickable-edges` on square boards; centred clickable line markers.
- `half` rendering for hex-of-* boards; `reverse-letters` / `reverse-numbers` (replacing `reverse-columns`).
- Custom row/column labels; sized annotation dots.

### Changed

- Areas (button bar, key, pieces) respect board rotation; ConHex context-aware back fill.
- Annotations transparent to pointer events; pointer-events none on glyph markers/annotations.
- Playground hosted on S3 with deploy script; development CI workflow tag.

### Fixed

- Rotated sowing pits and end-pit highlighting; hex-of-* label rotation; oversized pieces on hex-slanted boards.
- Pixel drift and opacity bugs; edge markers on hex-of-hex.

## [1.0.0-ci] - 2023-12-31

### Added

- GitHub Actions **dev/prod CI** workflows publishing versioned npm tarballs (`1.0.0-ci-*`).
- `pieces` area on default and stacking-offset renderers (clickable bar below board; Realm rearrangement).
- Realm triangle glyphs; Homeworlds **Catastrophe** button and compact renderer refresh.
- `blocked` cells on square* and hex grids; `stackMax` for stacking-tiles; `hide-labels`, `no-border`, borderless `piece` / `piece-square`.
- `vertex-fanorona` board; sphere glyph; `line` marker; stacking-tiles click returns tile index (1 = top).
- `hexFill`; fence `width`; **clickable-edges** on rect-of-hex; Streetcar Suburb glyphs.
- `ownerMark` on `pieces` area; `backFill`; **freespace** renderer; `label` marker (squares*).
- **stacking3D** renderer; **circular-cobweb** board with `fill` and `halo` markers; dashed `line` / `fence` markers; button bar `fill` per button.
- `usePieceAt` for legend-sized pieces; loadLegend supports pieces larger than cells.

### Changed

- Fence markers rounded by default; Homeworlds allows empty systems (partial renders).
- Homeworlds default orientation and diagram modes; sorted/compact ship layout.

### Fixed

- Volcano stash spacing and Firefox stash clicks; truncated labels in stacking-expanding.
- Homeworlds Firefox click handler and WebKit/SVG rendering issues.
- Button bar click propagation; honeycomb-grid rollback for layout regression.

## [1.0.0-beta] - 2023-04-30

Initial beta release.

## [0.8.0] - 2021-12-27

### Added

- Column labels are now infinite and fully customizable using the `columnLabels` renderer option. Just pass a string of characters.
- Added `buttonBar` to the `areas` property. This lets you create a vertical bank of buttons for use by the click handler. Button text can be arbitrarily styled. Example added to the playground.
- Added the `key` feature back, but it is now in the `areas` property and can only be arranged vertically and placed on the left or right. Other orientations may be added in the future. Example added to the playground.

### Changed

- The `static` property has been added to the `eject` annotation if you don't want each consecutive notation to be wider and wider.

## [0.7.0] - 2021-12-19

### Breaking Change

- Yet another breaking change. Found an issue where nested glyphs (symbols within symbols) couldn't be reused because of how the IDs got duplicated. So I completely refactored the glyph loading code. This has vastly simplified the `<defs>` section. It now only contains the glyphs defined in the legend. It means that glyphs in the sheets may *not* have hard-coded IDs. Let the renderer auto-assign them. More documentation on this is forthcoming.

### Added

- Documented the API. This involved adding full [TSDoc](https://tsdoc.org/) comments and using [TypeDoc](http://typedoc.org/) to generate the HTML. Also included an API description from Microsoft's [API Extractor](https://api-extractor.com/). The JSON schema is still documented manually. See the `/docs` folder.
- A new playground/demo site is now available at [https://abstractplay.com/renderer/](https://abstractplay.com/renderer/).
- Added `tileSpacing` property that, when combined with `tileWidth` and `tileHeight`, will break the tiles apart and space them from each other. Only works for `squares*` and `vertex*` boards.
- Added a `glyphmap: [string,string][]` option to the renderer (where `[string,string]` is the old glyph name mapped to a new glyph name). This lets the user swap any glyph for another. Say they prefer the square pieces to the default round ones. The front end could let them map `piece` to `piece-square`.
- Added glyphs for Alfred's Wyke.

## [0.6.0] - 2021-12-15

### Breaking Change

- The renderer now works correctly in both Chrome and Firefox. The glyph sheets have now all been converted to `symbol`s instead of basic `group`s. This has vastly simplified the layout code, though it required extensive code changes. Further testing is planned on other browsers.

### Added

- Added a new `glyph` marker for incorporating glyphs defined in the `legend` into the board itself. Only works in the `default` and `stacking-offset` renderers. This marker applies no extra padding around the glyph like it does for pieces. That would have to be added in the legend.
- Added a new `text` property to glyph definitions. This allows you to create arbitrary text glyphs using all the standard colour and layout options. It is mutually exclusive with the `name` property. Because not all implementations of JSON schema handle this sort of validation equally, validation is not handled at that level. If `name` is present, it will override the `text` property. If neither are present, a runtime error is thrown.
- Added a new `buffer` property to the `board` schema to create adjustable buffer zones on given edges of the board. The intent is that these would be used by the click handlers to do things like bear pieces off the board or other such interactions. Only works for `square*`, `vertex*`, and `go` boards. If a click handler is attached, they will all return the coordinates `-1, -1` and the label `_buffer_[DIR]`, either `N`, `E`, `S`, or `W`. Rotates correctly.

  **Note:** To avoid the buffer click handlers from interfering with the generic click handler on `vertex` boards, if a buffer is present at all (regardless of whether it is shown), the generic handler ignores clicks outside of the board's outer edge. This reduces the sensitivity of clicks along the edge, but it's still quite functional.

### Removed

- Removed the `key` feature for now. It is a decidedly nontrivial task to generalize this in a way that works cross-browser. Its only use so far has been for Volcano, and that is now obviated by the click handler. This is something I may revisit.

## [0.5.0] - 2021-12-10

### Added

- You can now render individual glyphs using all user settings by setting `board` to `null`. See the docs for details.
- Added `player` as a colour option in annotations.
- The pieces fit too snugly in the `hex-of-hex` board style. A 15% reduction has been baked in.
- Added a `fence` marker for drawing thick lines between cells. Only works for `squares*` board styles.
- Added a `dots` annotation so you can add dots on top of pieces as well as just on the board itself.
- Added a `squares-beveled` style that simply draws very faint gridlines, for use with fences. Will make this nicer later.
- Added a `stackOffset` property to the schema for manual adjustment of stack offsets in the `stacking-offset` renderer.
- Changed `annotations` to allow an empty list. There's really no reason to disallow it, other than to minimize JSON size. Still a good practice to cull it from the output if there aren't any.
- Added `boardHover` callback that triggers on `mousemove`. It is only applied to `stacking-expanding` boards and is intended to trigger the cell expansion feature.
- Attached `boardClick` handler to pieces in `localStash` areas and the Homeworlds global stash. It returns coordinates of `-1,-1` and the name of the piece.
- Adjusted `stacking-expanding` renderer to allow for the `board` and `pieces` attributes to be `null` to render *just* an `expandedColumn` area. This is an attempt and improving performance of `stacking-expanding` games in live use.
- Added `house`, `palace`, and `tower` glyphs to the `core` sheet for Urbino. Also added a dragon glyph that ended up not being used, but there it is.

### Fixed

- Fixed `renderStatic()` to work properly now under SVG.js 3.x and respect the size and id options.
- Fixed bug in `entropy` renderer that caused only the first character of pieces to be recognized.
- Fixed `renderglyph()`.
- Boards now finally rotate properly.
  - Homeworlds rotation has always worked and supports rotating in increments of 90 degrees, allowing players to see the board from their own perspective.
  - For the default renderer, rotation by 180 degrees is all that will ever be supported.
  - Rotation is disabled for the `stacking-expanding` renderer.
  - For the default renderer, all board styles are now fully supported, including click handlers, annotations, and markers.
  - The `stacking-offset` renderer also appears to work correctly.

## [0.4.0] - 2021-11-17

### Added

#### Boards

- Entropy board added as a special renderer. I want to minimize the number of special renderers, but there may end up being a few.
- Added basic hex maps. Right now the labels are designed for pointy-topped grids. As more games get added, some convenience options will be added to the schema and implementation adjusted.
- Added click handlers to the rest of the boards.
- Added better board rotation (180 degrees only) to all except the `stackingExpanding` renderer.

#### Schema

- `stacking-expanding` renderer added. It's the same as the default renderer but supports displaying an expanded column of pieces in a stack alongside the board.
- Added an `svgid` option to the main option set, letting you assign an `id` to the containing `svg` element. By default it is `_aprender`.
- Added a `showAnnotations` option to the main options set. When `false`, last-move indicators will be hidden.
- Added a `key` attribute that you can use to give players a key to the colours and pieces on the board. This is sometimes necessary if there are a lot of colours on the board and you want to make move entry simpler. Or if you want to indicate which player owns which colour. This is still in development. See "Known Issues" section.
- Added an `eject` annotation meant to show consequential movement (like eruptions in Volcano).
- Added `localStash` areas for rendering things liked captured pyramid pieces in Volcano.
- Added `markers` attribute to schema for adding three things:
  - small circles at given points
  - shaded polygons directly on the board (showing ownership, perhaps)
  - highlighted board edges (showing goals or ownership)

#### Glyphs

- Added `flattened` versions of the Looney pyramids. They all share a baseline instead of a centre.
- Added glyphs for Accasta. The horse is "wrong," but it's the closest I could get for now. Will adjust later.

### Changed

- **Breaking Change**: `boardClick` handler now moved into the options object for consistency. All that's changing is how you pass it to the library. It should only require a single change to client code, but let me know if the impact is much larger.
- `area` definitions changed to include a `type` field to simplify coding.

### Known Issues

- The key still needs positioning code tweaked for top and bottom, and for some reason I cannot move the glyph within each entry. I can move the text, but not the glyph. That will need to be sorted before a new release.
- The key also needs to be built and placed for all renderers. Right now it's only rendered by the `stacking-expanding` renderer.

## [0.3.0] - 2021-10-21

### Added

- Homeworlds renderer added, including proper rotation of the board.
- You can now adjust the height and width of the generated image within the container.
- Public API documented.
- `boardClick` callback now available.

## [0.2.1] - 2021-10-17

### Added

- `tileWidth` and `tileHeight` are now supported. This lets you draw thicker lines at intervals, simulating tiles.

### Fixed

- Rotation of pieces now works properly.

## [0.2.0] - 2021-10-05

### Added

- Most boards are now implemented:
  - `squares`: Grid of squares with no checkered pattern.
  - `squares-checkered`: Grid of squares with checkered pattern.
  - `vertex`: Grid where the pieces are placed at the intersections instead of the squares themselves.
  - `vertex-cross`: Same as `vertex` but with lines showing diagonal movement.
  - `go`: A standard Go board.
  - `hex-of-hex/tri/cir`: A hexagonal field composed of either hexes, triangles, or circles.
  - `snubsquare`: A unique topography where most cells have 4 or 5 connections.
- The lines making up the boards can now have their opacity, colour, and weight adjusted.
- Basic stacking renderers are now implemented.
- Composite pieces are now supported, including colouring, rotating, scaling, and nudging.
- The glyph library has been significantly expanded, including Piecepack icons, Looney pyramids, dice, and modern chess fonts.

### Changed

- Annotations have changed. There are three now supported:
  - `move`: Draws lines between the selected cells.
  - `enter` & `exit`: Both currently do the same thing. Different options will be added later.

### Known Issues

- Rotation of pieces can sometimes cause bizarre misalignments. This is mostly a problem for Looney pyramid glyphs. Rotation in increments of 90 degrees works fine most of the time.

## [0.1.0] - 2019-02-17

### Added

- Initial minimal-viable release of the rendering engine!
- Currently only produces square grids, and the glyph set is minimal.
- For game pieces, supports
  - 9 basic colours,
  - 4 colour-blind colours, and
  - 10 black-and-white patterns.
- Supports simple move annotations, with more to come eventually.
- Documentation is still minimal, but will be fleshed out over time. See the `docs` folder.
