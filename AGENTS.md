# Agent guide — renderer

SVG rendering for Abstract Play game states; authoritative render JSON schema. Package: `@abstractplay/renderer`. Human docs: [docs.abstractplay.com/renderer/](https://docs.abstractplay.com/renderer/).

## Abstract Play (wide)

Follow the canonical org-wide policy in [gameslib `AGENTS.md` — Abstract Play (wide)](https://github.com/AbstractPlay/gameslib/blob/develop/AGENTS.md#abstract-play-wide).

## Layout

| Path | Purpose |
|------|---------|
| `src/` | Renderer implementation, glyphs, boards (e.g. eleven) |
| `src/schemas/` | JSON schema + generated `.d.ts` |
| `test/` | Mocha unit tests |
| `test/fixtures/playground-samples.json` | **Canonical** playground + browser-test catalog |
| `playground/` | Demo UI, Vite config, `APRender.min.js` build |
| `test/playwright/` | Cross-browser smoke (structural health, not screenshots) |
| `docs/` | Contributor docs |

## Commands

| Command | When |
|---------|------|
| `npm test` | Mocha (`pretest` → typecheck) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run build` | Compile, postbuild smoke, lint, pack |
| `npm run playground` / `dist-dev` | Build `dist/` demo bundle |
| `npm run test:browser` | Playwright over all snippets (CI; build first) |
| `npm run regenerate-glyphs` | After glyph sheet edits (+ commit contact sheet / catalog) |
| `npm run docs:check:local` | Doc links when sibling `docs` repo exists |

Handoff: **`npm run typecheck`** and **`npm run lint`** (exit 0). Run `npm test`; run `npm run test:browser` when changing playground snippets or browser-visible bundle behaviour.

## New features and glyphs

1. **Renderer behaviour or JSON feature** — add a snippet to [`test/fixtures/playground-samples.json`](test/fixtures/playground-samples.json). Playground, harness, and Playwright import this file directly (no generated shim).
2. **Browser contract** — snippet must pass structural checks in `test/playwright/render-health.ts` (SVG `viewBox`, playfield groups, score-track health, no page errors). Not pixel diffs.
3. **New glyphs** — follow [Adding pieces](https://docs.abstractplay.com/renderer/adding-pieces/); run `npm run regenerate-glyphs` and commit catalog/contact outputs per [README.md](README.md).

Detail: [docs/playground-samples.md](docs/playground-samples.md).

## Tests

- **Mocha** — fast default; assert render **structure** and contracts, not tunable colours/scales when a relative check suffices.
- Fixtures: committed JSON under `test/fixtures/` (including playground catalog).
- **Integration:** `npm run test:integration` / bundle tests when touching exports.

## Documentation

New `docs/**/*.md` → [`docs/nav.json`](docs/nav.json). Run `npm run docs:check:local` after doc edits.

## Changelog

Substantive schema or rendering changes → [`CHANGELOG.md`](CHANGELOG.md), monthly `[1.0.0-ci]` sections.

## Contact

[#dev-curious on Discord](https://discord.abstractplay.com)
