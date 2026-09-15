import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { render } from "../../src/index.js";
import type { APRenderRep } from "../../src/schemas/schema.js";
import { coreRenderOptions, makeDraw } from "./renderTestDraw.js";

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), "..", "fixtures", "thumbnails");

/** Published thumbnail metas with local fixtures (see test/fixtures/thumbnails/). */
export const THUMBNAIL_FIXTURE_METAS = [
    "magnate",
    "fnap",
    "deckfish",
    "btt",
    "biscuit",
    "emu",
    "jacynth",
    "quincunx",
    "siegeofj",
    "garden",
    "moonsquad",
    "crosshairs",
    "tritium",
] as const;

export type ThumbnailMeta = (typeof THUMBNAIL_FIXTURE_METAS)[number];

export const thumbnailRenderOptions = {
    ...coreRenderOptions,
    sheets: ["core", "decktet", "piecepack", "dice", "looney"],
};

export const loadThumbnailFixture = (meta: ThumbnailMeta): APRenderRep => {
    const raw = readFileSync(join(fixtureDir, `${meta}.json`), "utf8");
    return JSON.parse(raw) as APRenderRep;
};

export const tryRenderThumbnail = (rep: APRenderRep, draw: ReturnType<typeof makeDraw>): boolean => {
    try {
        render(rep, { ...thumbnailRenderOptions, target: draw, rotate: 0 });
        return true;
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes("could not be found in the requested sheets")) {
            return false;
        }
        throw err;
    }
};

export type NudgedLegendClass = "fluid-only" | "has-text-nudge" | "none";

export const classifyLegendNudge = (entry: unknown): NudgedLegendClass => {
    const glyphs: unknown[] = Array.isArray(entry) ? entry : [entry];
    let hasNudge = false;
    let hasTextNudge = false;
    for (const g of glyphs) {
        if (typeof g !== "object" || g === null) {
            continue;
        }
        const glyph = g as { nudge?: unknown; text?: string };
        if (glyph.nudge === undefined) {
            continue;
        }
        hasNudge = true;
        if (glyph.text !== undefined && glyph.text.length > 0) {
            hasTextNudge = true;
        }
    }
    if (!hasNudge) {
        return "none";
    }
    return hasTextNudge ? "has-text-nudge" : "fluid-only";
};

export const legendKeysByNudgeClass = (rep: APRenderRep): Record<NudgedLegendClass, string[]> => {
    const out: Record<NudgedLegendClass, string[]> = {
        "fluid-only": [],
        "has-text-nudge": [],
        none: [],
    };
    if (rep.legend === undefined) {
        return out;
    }
    for (const key of Object.keys(rep.legend)) {
        out[classifyLegendNudge(rep.legend[key])].push(key);
    }
    return out;
};
