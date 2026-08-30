# Abstract Play Renderer

[![Build Status](https://travis-ci.com/AbstractPlay/renderer.svg?branch=main)](https://travis-ci.com/AbstractPlay/renderer)

This private NPM module graphically renders game states. This repository houses the authoritative JSON schema.

Currently the only supported output format is SVG. The library has been tested and works correctly in Chrome, Firefox, Opera, and Edge.

[A playground/demo area is now available.](https://renderer.dev.abstractplay.com) The [Abstract Play Designer](https://designer.abstractplay.com/) is another place you can interact with the rendering engine.

## Usage

In the browser, load `APRender.min.js` via a `<script>` tag (the playground and dokuwiki plugin use the same bundle). For a concrete example, [see the playground](https://renderer.dev.abstractplay.com).

From within Node, import from `@abstractplay/renderer` (`build/index.js`). Both paths expose the same API.

The API and schema are documented on the [docs site](https://docs.abstractplay.com/renderer/).

## Contributing

If you want to create a new set of graphics, see [Adding pieces](https://docs.abstractplay.com/renderer/adding-pieces/) and the [contact sheet](https://docs.abstractplay.com/renderer/contact-sheet/) for existing piece names. After changing glyph sheets, run `npm run contact-sheet` and commit `docs/contact-sheet.svg` and `contact.png`.

New renderer features should include a **playground snippet** so the public demo and cross-browser tests stay current. Edit [`test/fixtures/playground-samples.json`](test/fixtures/playground-samples.json) and commit the JSON — the playground and Playwright harness import it directly. See [Playground samples and browser tests](https://docs.abstractplay.com/renderer/playground-samples/) for the full workflow.

### Tests

- `npm test` — Mocha unit tests (fast; runs in CI).
- `npm run playground` — Vite dev server for the interactive demo (`playground/`).
- `npm run test:browser:install` — install Playwright browsers (once per machine).
- `npm run test:browser` — build `dist/` and render every playground snippet in Chromium, Firefox, and WebKit.

![Contact sheet](./contact.png "Rudimentary contact sheet")

## Contact

The [main website](https://www.abstractplay.com) houses the development blog and wiki. We encourage coders to join us on Discord (<https://discord.abstractplay.com>) in our `#dev-curious` channel if you have questions, and basic docs are available [on our wiki](https://abstractplay.com/wiki/doku.php?id=coding_docs).

## Deploy

- Clone the repo.
- From the newly created folder, run the following commands:
  - `npm install` (installs dependencies)
  - `npm run test` (makes sure everything is working)
  - `npm run test:browser` (optional locally; required in CI — playground snippets in Chromium, Firefox, WebKit)
  - `npm run build` (compiles TypeScript into `./build`)
  - `npm run dist-dev` (or `dist-prod` for minified output; Vite builds the playground and `APRender.min.js` into `./dist`)
