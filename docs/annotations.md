# Annotations

Annotations render **above** pieces to show moves, entries, exits, and highlights.

## Move arrows

*Example games:* [Arimaa](https://play.abstractplay.com/games/arimaa), [Bao](https://play.abstractplay.com/games/bao)

On **squares**, **vertex**, and **hex-of-hex** / **hex-of-tri** / **hex-of-cir** boards, **move** arrows default to starting and ending halfway between each cell centre and the cell edge along the direction of travel (so a vertical one-step arrow does not sit entirely on centre points). **`line`** annotations are unchanged and still use cell centres.

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
