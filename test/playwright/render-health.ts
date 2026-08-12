export interface RenderHealthResult {
    ok: boolean;
    message?: string;
}

/** Runs in the browser via page.evaluate — must stay free of imports. */
export function assertRenderHealth(): RenderHealthResult {
    const drawing = document.getElementById("drawing");
    if (!drawing) {
        return { ok: false, message: "missing #drawing container" };
    }

    const svg = drawing.querySelector("svg");
    if (!svg) {
        return { ok: false, message: "no svg in #drawing" };
    }

    const viewBox = svg.getAttribute("viewBox");
    if (!viewBox) {
        return { ok: false, message: "root svg missing viewBox" };
    }

    const vbParts = viewBox.trim().split(/[\s,]+/).map(Number);
    if (vbParts.length !== 4 || vbParts.some((n) => Number.isNaN(n))) {
        return { ok: false, message: `invalid viewBox: ${viewBox}` };
    }
    if (vbParts[2]! <= 0 || vbParts[3]! <= 0) {
        return { ok: false, message: `non-positive viewBox size: ${viewBox}` };
    }

    const board = svg.querySelector(
        '#board, #board-tableau, #pieces, #gridlines, #stash, [id*="board" i]',
    );
    if (!board) {
        const graphics = svg.querySelectorAll(
            "path, rect, circle, polygon, polyline, line, use, image, text",
        );
        if (graphics.length === 0) {
            return { ok: false, message: "no playfield group or rendered graphics" };
        }
    }

    const trackUses = svg.querySelectorAll('use[href*="_track_"], use[xlink\\:href*="_track_"]');
    for (const useEl of trackUses) {
        const height = Number.parseFloat(useEl.getAttribute("height") || "0");
        const href = useEl.getAttribute("href") || useEl.getAttribute("xlink:href") || "";
        if (!(height > 0)) {
            return { ok: false, message: `track use has zero height: ${href}` };
        }
    }

    const trackDefs = svg.querySelectorAll('defs svg[id*="_track_"]');
    for (const def of trackDefs) {
        const defVb = def.getAttribute("viewBox");
        if (!defVb) {
            return { ok: false, message: `track def missing viewBox: ${def.id}` };
        }
        const parts = defVb.trim().split(/[\s,]+/).map(Number);
        if (parts.length !== 4 || parts[2]! <= 0 || parts[3]! <= 0) {
            return { ok: false, message: `track def has non-positive viewBox (${def.id}): ${defVb}` };
        }
    }

    return { ok: true };
}
