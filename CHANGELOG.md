# Change log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Homeworlds renderer added, including proper rotation of the board.
- You can now adjust the height and width of the generated image within the container.
- Public API documented

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
