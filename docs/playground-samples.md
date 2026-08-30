# Playground samples and browser tests

The [renderer playground](https://renderer.dev.abstractplay.com) ships a library of example render JSON (“snippets”) that demonstrate boards, markers, annotations, engines, and niche features. The same catalog drives **cross-browser smoke tests** so layout bugs (for example Firefox score-track sizing) are caught before deploy.

## Layout

| Piece | Purpose |
|-------|---------|
| `test/fixtures/playground-samples.json` | **Canonical catalog** — edit this file to add or change snippets |
| `playground/playground.html` | Public demo page (deployed to `dist/playground.html`) |
| `playground/playground.js` | Playground UI (ESM; imports samples JSON and `@abstractplay/renderer`) |
| `playground/harness.html` | Minimal page used by Playwright (`?sample=<key>`) |
| `playground/harness.js` | Harness render logic |
| `playground/vite.config.ts` | Vite dev server and production MPA build → `dist/` |
| `playground/vite.aprender.config.ts` | IIFE build of `dist/APRender.min.js` (dokuwiki and legacy script tags) |
| `test/playwright/` | Playwright specs and structural health checks |
| `playwright.config.mjs` | Chromium / Firefox / WebKit projects; `vite preview` on port 4173 |

**CI** (`npm test` then `npm run test:browser`) runs every snippet in Chromium, Firefox, and WebKit on ubuntu-latest. **Mocha** unit tests remain the fast default; browser tests build the Vite playground and exercise the real browser bundle (`APRender.min.js`).

### Structural “renders cleanly” contract

Browser tests do **not** compare screenshots. Each snippet must:

- Produce an SVG in `#drawing` with a positive root `viewBox`
- Contain a playfield group (`#board`, `#board-tableau`, `#pieces`, etc.) or other visible graphics
- Give every score-track `<use href*="_track_">` a height &gt; 0 (Firefox regression)
- Give every track def SVG a non-zero `viewBox`
- Emit no page errors or `console.error` during render

Logic lives in `test/playwright/render-health.ts`. Targeted Mocha tests (for example `test/track-area.test.ts`) still cover edge cases in svgdom; browser tests exercise the bundled renderer.

## Adding a new snippet

**Always edit the JSON catalog.** The playground, harness, and Playwright tests import `test/fixtures/playground-samples.json` directly — there is no generated JS shim to sync.

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

### 3. Verify locally

```bash
npm test                                    # Mocha, including catalog validation
npm run test:browser:install                # once per machine
npm run test:browser                        # dist-dev → Playwright (94 snippets × 3 browsers)
```

Debug a single snippet:

```bash
npx playwright test --project=firefox --grep my-new-sample
```

**Local playground (hot reload, no build):**

```bash
npm run playground
```

Open `http://localhost:3000/` (redirects to `playground.html`) or use `?sample=my-new-sample` on the harness.

**Production-like preview** (after `npm run dist-dev`):

- Playground: `npx vite preview --config playground/vite.config.ts` → `http://localhost:4173/playground.html`
- Harness: `http://localhost:4173/harness.html?sample=my-new-sample`

`npm run test:browser` runs the full pipeline (`dist-dev` then Playwright with `vite preview`).

### 4. Deploy

`npm run deploy` / CI `deploy:ci` upload the Vite `dist/` folder (playground HTML, assets, and `APRender.min.js`) via serverless-finch. No manual file copies.

## Optional: docs site samples

`docs/samples/` holds **pretty-printed** JSON files for embedded examples on [docs.abstractplay.com](https://docs.abstractplay.com/renderer/). That folder is **not** wired to the playground catalog or Playwright. When a feature deserves a docs-page example, add or update a matching file there separately (same render content, formatted for humans).

Do **not** point Mocha or Playwright tests at `docs/samples/` — use inline fixtures under `test/` per project conventions.

## File map

```
test/fixtures/playground-samples.json   ← edit snippets here
playground/index.html                   ← dev root redirect → playground.html
playground/playground.html              ← public demo
playground/playground.js                ← demo UI (ESM)
playground/harness.html                 ← Playwright render target
playground/harness.js
playground/vite.config.ts               ← dev + MPA build to dist/
playground/vite.aprender.config.ts      ← APRender.min.js IIFE
test/playwright/samples.spec.ts         ← one test per snippet per browser
test/playwright/render-health.ts        ← in-browser assertions
test/playground-samples.test.ts         ← JSON catalog validation
playwright.config.mjs                   ← browser projects + vite preview
```

## npm scripts

| Script | What it does |
|--------|----------------|
| `npm test` | Mocha unit tests (svgdom); no browsers |
| `npm run playground` | Vite dev server on port 3000 (`playground/`) |
| `npm run dist-dev` | Build `dist/` (playground + `APRender.min.js`, unminified playground assets) |
| `npm run dist-prod` | Same, production mode (minified) |
| `npm run test:browser:install` | Install Playwright browsers (once per machine/CI image; **requires Node.js 20+**) |
| `npm run test:browser` | `dist-dev` → Playwright (282 runs: 94 snippets × 3 browsers) |

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| Mocha fails catalog validation | Invalid JSON in a snippet `render` string, or missing `name` / `render` on an entry |
| Playwright “missing sample” | Key typo in URL or snippet not added to `playground-samples.json` |
| Playwright track height failure | Track layout bug (check `niche-areas-track` in Firefox first) |
| Playwright passes locally, fails in CI | Run `npm run test:browser` (full pipeline), not `npx playwright test` alone without `dist-dev` |
| Custom renderer fails “no playfield” | Renderer must still output an SVG with graphics; health check accepts `#pieces`, `#gridlines`, `#stash`, or any path/rect/use content |
| `npm run playground` 404 on samples | Vite `fs.allow` includes repo root; ensure `test/fixtures/playground-samples.json` exists |
