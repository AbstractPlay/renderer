# Custom glyph definitions

Use **`glyphDefs`** when a game needs vector art that is not on the contact sheet — for example algorithm-generated piece shapes or (eventually) user-supplied silhouettes. Definitions are shared by id; legend entries reference them with **`def`** and apply **`paint`** like sheet glyphs.

Sheet pieces still use `{ "name": "piece", … }`. See [Glyphs](/renderer/glyphs/) for the full legend model.

## glyphDefs map

Each key is a definition id (no whitespace). Each value has:

| Field | Purpose |
| --- | --- |
| `viewBox` | Four numbers `[minX, minY, width, height]` — same role as a sheet symbol viewBox. |
| `markup` | Inner SVG fragment (not a full document). Sanitized at render time. |

Tag paintable regions with **`data-slot-fill`** and **`data-slot-stroke`** exactly as on contact-sheet art ([Designing sheet glyphs](/renderer/designing-glyphs/), [Glyph paint slots](/renderer/glyph-slots/)). Legend **`paint`** then works the same way as for `{ "name": … }` layers.

## Legend layer

```json
"B": { "def": "go-disc", "paint": { "fill": 1 } }
```

Optional transforms (`scale`, `rotate`, `opacity`, `nudge`, `flipx`, `flipy`, `orientation`) match sheet glyph layers. Composite arrays may mix `def`, `name`, and `text` layers.

## Examples (contact-sheet equivalents)

The core **`piece`** disc (filled token + rim) and **`circle`** ring token recreated as customs:

{% renderWidget "samples/custom-glyphs-disc.json" %}

{% renderWidget "samples/custom-glyphs-circle.json" %}

The disc example uses a 105×105 viewBox with a 5-unit stroke inset, matching the core `piece` glyph geometry. The ring uses a thick stroke on `data-slot-stroke="fill"` only, like core `circle`.

## Sanitized markup

Only simple drawing elements are allowed (`g`, `path`, `circle`, `ellipse`, `rect`, `line`, `polyline`, `polygon`) with presentation attributes and `data-slot-*` / `data-context-*` tags. The renderer rejects scripts, links, `foreignObject`, `image`, `use`, inline `style`, and event attributes. Markup has size and complexity limits.

## Dedupe

Put SVG in **`glyphDefs` once**, then point every legend key that shares the shape at the same **`def`**. Player colours differ only in each entry’s **`paint`**.
