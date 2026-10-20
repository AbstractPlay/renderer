# Homeworlds peripheral layout

The `homeworlds` renderer places **home** systems by compass `seat` around a peripheral block. **Peripheral** systems (no `seat`) default to **star-size columns** (sizes 1, 2, 3 left to right). That default ignores `options.rotate`; only homes and ship facings rotate.

## Optional `layout` on board systems

Peripheral entries may include `layout` with **either** `row` **or** `column` (not both), both **0-based**:

| Field | Meaning (seat / compass frame) |
|-------|------------------------------|
| `row` | Row mode: band parallel to E–W. `row: 0` is closest to **N**; larger values step toward **S**. |
| `column` | Column mode: band parallel to N–S. `column: 0` is closest to **W**; larger values step toward **E**. |
| `order` | Optional sort within the same row or column. Lower first. Placement along the band is screen **left→right** (row mode) or **top→bottom** (column mode), regardless of `rotate`. Default: index in `board[]`. |

**Explicit layout applies only when every peripheral has a valid `layout` and all use the same axis** (all `row` or all `column`). Otherwise the renderer logs a warning and falls back to star-size columns.

`row` / `column` indices are mapped to SVG using `options.rotate` (and optional `board.rotate`) so that, for example, `row: 0` stays the band adjacent to compass **N** when the viewer rotates 180°. Gameslib should emit layout in seat frame once; the frontend passes `rotate` as today.

Homes ignore `layout`. Integrators choose which systems appear and their indices; the renderer does not compute distance or perspective.

## Example (row mode)

In a two-home game, three peripherals can share one row and sort left-to-right by `order` (instead of star-size columns):

```json
{
  "name": "Pheedo",
  "stars": ["Y1"],
  "layout": { "row": 0, "order": 0 }
}
```

Full sample: [`docs/samples/niche-homeworlds-layout.json`](samples/niche-homeworlds-layout.json) and playground `niche-homeworlds-layout` in [Playground samples](playground-samples.md).
