# Annotations

Annotations render **above** pieces to show moves, entries, exits, and highlights.

## Move arrows

*Example games:* [Arimaa](https://play.abstractplay.com/games/arimaa), [Bao](https://play.abstractplay.com/games/bao)

On **squares**, **hex-of-hex**, and **hex-of-cir** boards, **move** arrows default to a small inset along the direction of travel (about **10% of cell size** at each end, not centre-to-centre). **`vertex`**, **`hex-of-tri`**, and **`line`** annotations stay centre-to-centre.

**`line`** annotations draw circular endpoint markers by default (same dots as **`move`** with `"arrow": false`). Set `"anchors": false` on a line entry to omit them.

To restore centre-to-centre move arrows for one annotation, set `"cellInset": false` on that move entry. To disable inset for an entire render, pass `moveAnnotationCellInset: false` in render options.

Board **markers** of type `line` may still use `"shorten"` as a **percentage** of total segment length; that is unrelated to move annotation inset.

{% renderWidget "samples/notes-move-simple.json" %}

## Enter / exit / eject

*Example games:* [Volcano](https://play.abstractplay.com/games/volcano), [Gliss](https://play.abstractplay.com/games/gliss), [Yavalath](https://play.abstractplay.com/games/yavalath)

{% renderWidget "samples/notes-enter-exit.json" %}

## Dots and glyph annotations

*Example games:* [Crosshairs](https://play.abstractplay.com/games/crosshairs), [Majorities](https://play.abstractplay.com/games/majorities), [Stawvs](https://play.abstractplay.com/games/stawvs)

{% renderWidget "samples/notes-dots.json" %}

{% renderWidget "samples/notes-glyph.json" %}
