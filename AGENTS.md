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
| `npm run docs:check:local` | Nav slugs in `docs/nav.json` have matching pages (not link validation) |

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

Published site: [docs.abstractplay.com/renderer/](https://docs.abstractplay.com/renderer/) (built from the [docs](https://github.com/AbstractPlay/docs) repo; renderer `main` triggers `dep_update_prod`).

- New `docs/**/*.md` → [`docs/nav.json`](docs/nav.json) (`slug` without `.md`).
- **Internal links** in `docs/**/*.md`: use **published paths** (`/renderer/playground-samples/`, `/renderer/samples/foo.json`), not sibling `other-page.md` — `docs:check` resolves from the page URL (e.g. `/renderer/engines/`), so relative `.md` links break prod deploy. Copy URL style from [`docs/index.md`](docs/index.md).
- **`docs/samples/*.json`**: sheet legend glyphs use **`paint`** (`paint.fill`, etc.), not `colour` / `colour2`; `npm test` enforces via `docs-samples-glyph-paint.test.ts`. Use `npm run migrate-glyph-paint` when copying gameslib JSON.

**After doc edits:** `npm run docs:check:local` here, then from sibling **`../docs`**: `npm run docs:check` (fix all `ERROR:` lines, especially `Broken doc link in vendor/renderer/...`).

## Changelog

Substantive schema or rendering changes → [`CHANGELOG.md`](CHANGELOG.md).

Follow org-wide **monthly batching** (one `[1.0.0-ci] - YYYY-MM-DD` section per calendar month; set the section date to the latest change day in that month—do not add a second dated block in the same month).

When editing the changelog:

- **New features** — one **Added** bullet per feature describing **current shipped behaviour**, not a bullet per follow-up fix or PR.
- **Cross-cutting behaviour** (e.g. `boardClick` routing that affects many board styles)—**Changed** or **Fixed**, often a single bullet; avoid duplicating the same theme under Added.
- **Avoid** many sub-bullets prefixed with the same label (e.g. five “Composite boards:” lines); fold fixes into the feature bullet or a global **Changed** entry instead.

## Contact

[#dev-curious on Discord](https://discord.abstractplay.com)
