# Change log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- A new playground/demo site is now available at [https://abstractplay.com/renderer/](https://abstractplay.com/renderer/).
- Added `tileSpacing` property that, when combined with `tileWidth` and `tileHeight`, will break the tiles apart and space them from each other. Only works for `squares*` and `vertex*` boards.
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
