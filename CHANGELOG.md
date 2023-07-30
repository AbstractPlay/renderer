# Change log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

* Added two triangle pieces to core sheet for game Realm.
* Added an `area` called `pieces` used by the default renderer. Give it a list of pieces in the legend, and it will place them in a bar beneath the board. Current use is for tracking pieces being rearranged in a game of Realm. Also added to the `stacking-offset` renderer. (The playground has been updated.)
* Added a Catastrophe button to the Homeworlds renderer.
* Added `blocked` property for use in `square*` boards to black out entire cells and disable click handlers. Respects `strokeColour` and `strokeOpacity`. Also expanded to include hex grids, in which case it simply never draws the hex.
* Added `stackMax` property for use by the `stacking-tiles` renderer to set the number of tiles to be displayed in a cell.
* Added `hide-labels` option to do just that.
* Added `no-border` option to omit drawing the very outside line of square boards.
* Added `-borderless` versions of `piece` and `piece-square`.
* Added `vertex-fanorona` board style.
* Added a sphere glyph to the core sheet.
* Added a `line` marker for drawing arbitrary lines on a board.
* In the `stacking-tiles` renderer, the click handler now returns the number of the tile being clicked, with 1 being the top piece.
* Added `hexFill` property that will fill hexes in a hex grid with a given colour.
* Added `width` property to the `fence` marker so the game can adjust the weight of the fence.
* Added a `clickable-edges` option that only affects rect-of-hex maps. It renders the edges using the base stroke width, colour, etc., but it also attaches a click handler, returning the row, column, and face the edge represents. The renderer does not double up on edges (e.g., a1NE and b1SW are the same edge, and only one will be rendered).
* Added glyphs for Streetcar Suburb.
* Added `ownerMark` property to generic `pieces` area to add a bar of colour indicating ownership.
* Added `backFill` property to add background fill to entire image.
* Added `freespace` renderer, which lets you place arbitrary glyphs in arbitrary positions and orientations.
* Added `label` marker for drawing arbitrary text to a board. Currently only enabled for `squares*` boards.
* Added `stacking3D` renderer. Can be useful for stacking games, where stacks can get arbitrarily high. For now used for alternate Volcano display.
* Added fixed `dashed` property to `line` marker and a customizable `dashed` property to the `fence` marker to allow for customizable dashes.
* Added `circular-cobweb` board with associated `fill` and `halo` markers.
* Added `fill` attribute to button bar for individual filling.

### Fixed

* Fixed bug causing excess whitespace between captured stashes in Volcano games.
* Rebuilt the Homeworlds renderer to make it work in Firefox. Also tweaked the default renderer so the new `pieces` area would also work in Firefox.
* More Volcano fixes. Click handler on stash wasn't working in Firefox. Label text was getting truncated.
* The button bar click handler now stops propagation.

### Changed

* Fence markers are now rounded by default.
* Homeworlds: Systems with now ships are now allowed and are displayed properly. Necessary for partial renders.

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
