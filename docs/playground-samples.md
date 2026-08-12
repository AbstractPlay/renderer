# Playground samples and browser tests

The [renderer playground](https://renderer.dev.abstractplay.com) ships a library of example render JSON (“snippets”) that demonstrate boards, markers, annotations, engines, and niche features. The same catalog drives **cross-browser smoke tests** so layout bugs (for example Firefox score-track sizing) are caught before deploy.

## What changed

| Piece | Purpose |
|-------|---------|
| `test/fixtures/playground-samples.json` | **Canonical catalog** — edit this file to add or change snippets |
| `test/playground-samples.js` | Generated browser shim (`PLAYGROUND_SAMPLES`); committed so the playground works without a build step |
| `test/playground.js` | Playground UI logic only; reads `var samples = PLAYGROUND_SAMPLES` |
| `test/browser/harness.html` | Minimal page used by Playwright (`?sample=<key>`) |
| `test/playwright/` | Playwright specs and structural health checks |
| `bin/sync-playground-samples.mjs` | Regenerates `playground-samples.js` from the JSON catalog |

**CI** (`npm test` then `npm run test:browser`) runs every snippet in Chromium, Firefox, and WebKit on ubuntu-latest. **Mocha** unit tests remain the fast default; browser tests use the webpack browser bundle (`APRender.min.js`).

### Structural “renders cleanly” contract

Browser tests do **not** compare screenshots. Each snippet must:

- Produce an SVG in `#drawing` with a positive root `viewBox`
- Contain a playfield group (`#board`, `#board-tableau`, `#pieces`, etc.) or other visible graphics
- Give every score-track `<use href*="_track_">` a height &gt; 0 (Firefox regression)
- Give every track def SVG a non-zero `viewBox`
- Emit no page errors or `console.error` during render

Logic lives in `test/playwright/render-health.ts`. Targeted Mocha tests (for example `test/track-area.test.ts`) still cover edge cases in svgdom; browser tests exercise the real bundle.

## Adding a new snippet

**Always edit the JSON catalog.** Do not hand-edit `test/playground-samples.js` (it is regenerated).

### 1. Choose a stable key

Use a short kebab-case id that groups related samples:

| Prefix | Examples |
|--------|----------|
| `pieces-` | `pieces-simple`, `pieces-dice` |
| `board-` | `board-star`, `board-fractured-flat` |
| `boards-` | `boards-sowing-pips` |
| `formatting-` | `formatting-tiling-spaced` |
| `markers-` | `markers-flood` |
| `notes-` | `notes-move-simple` |
| `niche-` | `niche-isometric`, `niche-areas-track` |

The key appears in the playground dropdown, deep links (`?sample=<key>`), and test names.

### 2. Add an entry to `playground-samples.json`

Each entry has three fields:

```json
"my-new-sample": {
  "name": "Human title in the playground dropdown",
  "description": "HTML allowed — explains what the snippet demonstrates.",
  "render": "{...minified render JSON as a single string...}"
}
```

- **`render`** must be a **string** containing valid render JSON (what you would pass to `APRender.render()`), not a nested object. Escape quotes as `\"` and newlines in `pieces` strings as `\\n`.
- Build the object in the designer or playground, then minify with `JSON.stringify(yourObject)` in the browser console or Node.
- Place niche samples near related entries (for example `niche-areas-*` together).

**Example** (score track on a fractured-flat board): see `niche-areas-track` in the catalog.

### 3. Regenerate the browser shim

```bash
npm run sync-playground-samples
```

This updates `test/playground-samples.js` and `test/browser/playground-samples.js`. **Commit both the JSON and the generated JS.**

### 4. Verify locally

```bash
npm test                                    # Mocha, including catalog drift test
npm run test:browser:install                # once per machine
npm run test:browser                        # all snippets × 3 browsers
```

Debug a single snippet:

```bash
npx playwright test --project=firefox --grep my-new-sample
```

Preview in the playground after `npm run dist-dev` and copying files to `dist/`, or open the harness while the test server is running:

`http://localhost:4173/harness.html?sample=my-new-sample`

### 5. Deploy

`npm run deploy` / CI `deploy:ci` already run `sync-playground-samples` and copy `playground-samples.js` to `dist/` with the playground HTML.

## Optional: docs site samples

`docs/samples/` holds **pretty-printed** JSON files for embedded examples on [docs.abstractplay.com](https://docs.abstractplay.com/renderer/). That folder is **not** wired to the playground catalog or Playwright. When a feature deserves a docs-page example, add or update a matching file there separately (same render content, formatted for humans).

Do **not** point Mocha or Playwright tests at `docs/samples/` — use inline fixtures under `test/` per project conventions.

## File map

```
test/fixtures/playground-samples.json   ← edit snippets here
test/playground-samples.js              ← generated; commit after sync
test/playground.js                      ← UI only
test/playground.html                    ← loads APRender.min.js + samples + playground.js
test/browser/harness.html               ← Playwright render target
test/browser/serve.mjs                  ← static server (port 4173)
test/playwright/samples.spec.ts         ← one test per snippet per browser
test/playwright/render-health.ts        ← in-browser assertions
test/playground-samples.test.ts         ← JSON ↔ JS key drift check
bin/sync-playground-samples.mjs         ← JSON → JS generator
playwright.config.ts                    ← chromium / firefox / webkit projects
```

## npm scripts

| Script | What it does |
|--------|----------------|
| `npm test` | Mocha unit tests (svgdom); no browsers |
| `npm run sync-playground-samples` | Regenerate `playground-samples.js` from JSON |
| `npm run test:browser:install` | Install Playwright browsers (once per machine/CI image; **requires Node.js 20+**) |
| `npm run test:browser` | sync → `dist-dev` → copy bundle → Playwright (282 runs: 94 snippets × 3 browsers) |

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| Mocha fails “playground-samples.js matches … keys” | Ran sync locally but did not commit `playground-samples.js`, or edited the JS file by hand |
| Playwright “missing sample” | Key typo in URL or JSON not synced to `test/browser/playground-samples.js` |
| Playwright track height failure | Track layout bug (check `niche-areas-track` in Firefox first) |
| Playwright passes locally, fails in CI | Run `npm run test:browser` (full pipeline), not `npx playwright test` alone without building/copying `APRender.min.js` |
| Custom renderer fails “no playfield” | Renderer must still output an SVG with graphics; health check accepts `#pieces`, `#gridlines`, `#stash`, or any path/rect/use content |
