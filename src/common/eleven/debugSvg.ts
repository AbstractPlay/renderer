import type { ElevenGraphHelpers, ElevenTopology } from "./types.js";

export type ElevenDebugLabelMode = "index" | "pitch";

export type RenderElevenTopologyDebugOptions = {
    label?: ElevenDebugLabelMode;
    /** Pre-built helpers when labeling with pitch ids. */
    helpers?: ElevenGraphHelpers;
};

const labelForSpace = (
    index: number,
    mode: ElevenDebugLabelMode,
    helpers: ElevenGraphHelpers | undefined,
): string => {
    if (mode === "index") {
        return String(index);
    }
    if (helpers === undefined) {
        throw new Error("pitch labels require ElevenGraphHelpers");
    }
    const pitchId = helpers.pitchIdByIndex.get(index);
    if (pitchId === undefined) {
        throw new Error(`no pitch id for index ${index}`);
    }
    return pitchId;
};

const labelFontSize = (text: string, mode: ElevenDebugLabelMode) => {
    if (mode === "index") {
        return 9;
    }
    return text.length > 10 ? 6.5 : 7.5;
};

export const renderElevenTopologyDebugSvg = (
    topology: ElevenTopology,
    options: RenderElevenTopologyDebugOptions = {},
): string => {
    const mode = options.label ?? "index";
    const helpers = options.helpers;
    const pad = topology.padding ?? 8;
    const maxX =
        Math.max(
            topology.grassGrid.originX + topology.grassGrid.cols * topology.grassGrid.cellW,
            ...topology.spaces.map((s) => s.x + s.r),
        ) + pad;
    const maxY =
        Math.max(
            topology.grassGrid.originY + topology.grassGrid.rows * topology.grassGrid.cellH,
            ...topology.spaces.map((s) => s.y + s.r),
        ) + pad;

    const parts: string[] = [];
    const { originX, originY, cellW, cellH, cols, rows } = topology.grassGrid;
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = originX + col * cellW;
            const y = originY + row * cellH;
            const fill = (row + col) % 2 === 0 ? "#e8f4c8" : "#d0e8a0";
            parts.push(`<rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" fill="${fill}"/>`);
        }
    }

    for (const m of topology.markers) {
        if (m.kind === "midline") {
            parts.push(
                `<line x1="${m.x1}" y1="${m.y1}" x2="${m.x2}" y2="${m.y2}" stroke="#bbb" stroke-width="2"/>`,
            );
        } else if ("points" in m && m.points) {
            const d = m.points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ") + " Z";
            parts.push(`<path d="${d}" fill="none" stroke="#bbb" stroke-width="1.5"/>`);
            if (m.bump && m.bump.length >= 2) {
                const bumpD = m.bump.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ");
                parts.push(`<path d="${bumpD}" fill="none" stroke="#bbb" stroke-width="1.5"/>`);
            }
        } else if ("r" in m && m.r !== undefined) {
            const cx = (m as { cx: number }).cx;
            const cy = (m as { cy: number }).cy;
            parts.push(
                `<circle cx="${cx}" cy="${cy}" r="${m.r}" fill="none" stroke="#bbb" stroke-width="1.5"/>`,
            );
        }
    }

    for (const [a, b] of topology.moveEdges) {
        const sa = topology.spaces[a];
        const sb = topology.spaces[b];
        parts.push(
            `<line x1="${sa.x}" y1="${sa.y}" x2="${sb.x}" y2="${sb.y}" stroke="#c62828" stroke-width="1.25" stroke-opacity="0.55"/>`,
        );
    }
    for (const [a, b] of topology.shootEdges) {
        const sa = topology.spaces[a];
        const sb = topology.spaces[b];
        parts.push(
            `<line x1="${sa.x}" y1="${sa.y}" x2="${sb.x}" y2="${sb.y}" stroke="#1565c0" stroke-width="2" stroke-dasharray="6 4" stroke-opacity="0.9"/>`,
        );
    }

    for (const s of topology.spaces) {
        const text = labelForSpace(s.i, mode, helpers);
        const fs = labelFontSize(text, mode);
        parts.push(
            `<circle id="eleven-space-${s.i}" cx="${s.x}" cy="${s.y}" r="${s.r}" fill="#fff" fill-opacity="0.85" stroke="#333" stroke-width="1.25"/>`,
        );
        parts.push(
            `<text x="${s.x}" y="${s.y}" font-family="ui-sans-serif,system-ui,sans-serif" font-size="${fs}" font-weight="600" text-anchor="middle" dominant-baseline="central" fill="#111">${text}</text>`,
        );
    }

    const title =
        mode === "pitch" ? "Eleven topology (pitch ids)" : "Eleven topology (stored JSON)";
    parts.push(
        `<rect x="12" y="12" width="260" height="52" fill="#fff" fill-opacity="0.92" stroke="#ccc"/>`,
    );
    parts.push(
        `<text x="22" y="30" font-family="ui-sans-serif,system-ui,sans-serif" font-size="11" font-weight="600">${title}</text>`,
    );
    parts.push(
        `<line x1="22" y1="42" x2="42" y2="42" stroke="#c62828" stroke-width="2"/><text x="48" y="46" font-size="10" font-family="ui-sans-serif,sans-serif">move (${topology.moveEdges.length})</text>`,
    );
    parts.push(
        `<line x1="120" y1="42" x2="140" y2="42" stroke="#1565c0" stroke-width="2" stroke-dasharray="6 4"/><text x="146" y="46" font-size="10" font-family="ui-sans-serif,sans-serif">shoot (${topology.shootEdges.length})</text>`,
    );

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${maxX}" height="${maxY}" viewBox="0 0 ${maxX} ${maxY}">
  <title>Eleven board topology debug</title>
  ${parts.join("\n  ")}
</svg>
`;
};
