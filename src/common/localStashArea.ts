import type { APRenderRep, Glyph } from "../schemas/schema.js";

/** Vertical offset between solid pyramid tiers as a fraction of stash piece size (0.75 × board cell). */
export const LOCAL_STASH_STACK_LAYER_OFFSET = 0.35;

/** Vertical step between silhouette (`pyramid-up-*-3D`) tiers as a fraction of stash piece cell size. */
export const LOCAL_STASH_SILHOUETTE_STEP_FRAC = 0.15;

/** Baseline nudge within a stash cell (see `localStashArea` in `_base.ts`). */
export const LOCAL_STASH_PIECE_BASE_Y_FRAC = 0.15;

export type LocalStashColumnProfile = "solid" | "silhouette3D";

const SILHOUETTE_GLYPH = /^pyramid-up-(?:small|medium|large)-3D$/;

/** Pack stack column indices into rows (one index per stack column). */
export const buildLocalStashRows = (stackCount: number, maxStacksPerRow: number): number[][] => {
    if (stackCount <= 0 || maxStacksPerRow <= 0) {
        return [];
    }
    const rows: number[][] = [];
    for (let i = 0; i < stackCount; i += maxStacksPerRow) {
        const row: number[] = [];
        for (let j = i; j < Math.min(i + maxStacksPerRow, stackCount); j++) {
            row.push(j);
        }
        rows.push(row);
    }
    return rows;
};

const isGlyphRecord = (entry: unknown): entry is Glyph => {
    return typeof entry === "object" && entry !== null && !Array.isArray(entry);
};

type LegendEntry = NonNullable<APRenderRep["legend"]>[string];

const glyphNamesFromEntry = (entry: LegendEntry | undefined): string[] => {
    if (entry === undefined) {
        return [];
    }
    if (Array.isArray(entry)) {
        const names: string[] = [];
        for (const part of entry) {
            if (isGlyphRecord(part) && "name" in part) {
                names.push(part.name);
            }
        }
        return names;
    }
    if (isGlyphRecord(entry) && "name" in entry) {
        return [entry.name];
    }
    return [];
};

/** Resolve the sheet glyph name for a stash legend key (composite arrays included). */
export const resolveLocalStashGlyphName = (
    legend: APRenderRep["legend"] | undefined,
    key: string,
): string | undefined => {
    if (legend === undefined || key === "" || key === "-") {
        return undefined;
    }
    const names = glyphNamesFromEntry(legend[key]);
    return names[0];
};

/**
 * Looney `pyramid-up-*-3D` geometry (100×100 viewBox): distance from glyph centre down to the base line,
 * as a fraction of glyph height. Keeps nested silhouettes base-aligned in a column or row.
 */
const PYRAMID_UP_3D_BASE_DOWN_FRAC: Record<1 | 2 | 3, number> = {
    1: 0,
    2: 0.15,
    3: 0.3,
};

/** Apex height above glyph centre, as a fraction of glyph height (same viewBox as {@link PYRAMID_UP_3D_BASE_DOWN_FRAC}). */
const PYRAMID_UP_3D_APEX_ABOVE_CENTER_FRAC: Record<1 | 2 | 3, number> = {
    1: 0.15,
    2: 0.3,
    3: 0.45,
};

const tierFromSilhouetteGlyphName = (name: string | undefined): 1 | 2 | 3 | undefined => {
    if (name === "pyramid-up-small-3D") {
        return 1;
    }
    if (name === "pyramid-up-medium-3D") {
        return 2;
    }
    if (name === "pyramid-up-large-3D") {
        return 3;
    }
    return undefined;
};

/** Resolve pyramid tier (1–3) for silhouette stash placement from the legend glyph name only. */
export const localStashSilhouetteTier = (
    legend: APRenderRep["legend"] | undefined,
    key: string,
): 1 | 2 | 3 | undefined => {
    if (key === "-") {
        return undefined;
    }
    return tierFromSilhouetteGlyphName(resolveLocalStashGlyphName(legend, key));
};

/** Centre Y for a silhouette piece whose base sits on `sharedBaseY` (SVG y down). */
export const localStashSilhouettePieceCenterY = (
    sharedBaseY: number,
    tier: 1 | 2 | 3,
    cellsize: number,
): number => {
    return sharedBaseY - PYRAMID_UP_3D_BASE_DOWN_FRAC[tier] * cellsize;
};

/** Shared base line Y for one wrapped row of silhouette columns (SVG y down). */
export const localStashSilhouetteRowSharedBaseY = (
    contentY: number,
    cellsize: number,
): number => {
    return contentY + cellsize - LOCAL_STASH_PIECE_BASE_Y_FRAC * cellsize;
};

/** Vertical span above the shared base line needed for one silhouette column. */
export const localStashSilhouetteColumnStackSpanPx = (
    stack: string[],
    legend: APRenderRep["legend"] | undefined,
    cellsize: number,
): number => {
    let maxAboveBase = 0;
    for (const key of stack) {
        if (key === "-") {
            continue;
        }
        const tier = localStashSilhouetteTier(legend, key);
        if (tier === undefined) {
            continue;
        }
        const aboveBase =
            PYRAMID_UP_3D_BASE_DOWN_FRAC[tier] + PYRAMID_UP_3D_APEX_ABOVE_CENTER_FRAC[tier];
        maxAboveBase = Math.max(maxAboveBase, aboveBase);
    }
    return maxAboveBase * cellsize;
};

/**
 * Spacing profile for one stack column, from legend glyph names (not `renderer`).
 */
export const localStashColumnProfile = (
    stack: string[],
    legend: APRenderRep["legend"] | undefined,
): LocalStashColumnProfile => {
    for (const key of stack) {
        if (key === "-") {
            continue;
        }
        const name = resolveLocalStashGlyphName(legend, key);
        if (name !== undefined && SILHOUETTE_GLYPH.test(name)) {
            return "silhouette3D";
        }
    }
    return "solid";
};

export const localStashVerticalStepPx = (
    profile: LocalStashColumnProfile,
    layerOffsetFrac: number,
    cellsize: number,
): number => {
    if (profile === "silhouette3D") {
        return LOCAL_STASH_SILHOUETTE_STEP_FRAC * cellsize;
    }
    return layerOffsetFrac * cellsize;
};

/**
 * Vertical steps from the row baseline to array index `pieceIndex`.
 * Contract: `stash[column][0]` is the bottom slot; index increases upward.
 * Legacy `"-"` entries occupy a slot (step) but are not drawn.
 */
export const localStashStepsAboveBottom = (stack: string[], pieceIndex: number): number => {
    return Math.max(pieceIndex, 0);
};

/** Highest step index among drawn pieces in one column. */
export const localStashColumnMaxStepsAboveBottom = (stack: string[]): number => {
    let maxSteps = 0;
    for (let i = 0; i < stack.length; i++) {
        const key = stack[i]!;
        if (key === "-") {
            continue;
        }
        maxSteps = Math.max(maxSteps, localStashStepsAboveBottom(stack, i));
    }
    return maxSteps;
};

/** Step span for row band / bottom-alignment. */
export const localStashColumnStepSpan = (stack: string[]): number => {
    if (stack.length <= 1) {
        return localStashColumnMaxStepsAboveBottom(stack);
    }
    return Math.max(stack.length - 1, localStashColumnMaxStepsAboveBottom(stack));
};

/** Extra vertical span above the baseline cell for one column (pixels). */
export const localStashColumnStackSpanPx = (
    stack: string[],
    legend: APRenderRep["legend"] | undefined,
    layerOffsetFrac: number,
    cellsize: number,
): number => {
    const profile = localStashColumnProfile(stack, legend);
    if (profile === "silhouette3D") {
        return localStashSilhouetteColumnStackSpanPx(stack, legend, cellsize);
    }
    const stepPx = localStashVerticalStepPx(profile, layerOffsetFrac, cellsize);
    return localStashColumnStepSpan(stack) * stepPx;
};

/** Max stack span among columns in one wrapped row (pixels). */
export const localStashRowStackSpanPx = (
    stash: string[][],
    row: number[],
    legend: APRenderRep["legend"] | undefined,
    layerOffsetFrac: number,
    cellsize: number,
): number => {
    let maxSpan = 0;
    for (const stackIdx of row) {
        maxSpan = Math.max(
            maxSpan,
            localStashColumnStackSpanPx(stash[stackIdx]!, legend, layerOffsetFrac, cellsize),
        );
    }
    return maxSpan;
};

/** Max step count among columns in one wrapped row (for bottom-alignment within the row band). */
export const localStashRowMaxSteps = (stash: string[][], row: number[]): number => {
    let maxSteps = 0;
    for (const stackIdx of row) {
        maxSteps = Math.max(maxSteps, localStashColumnStepSpan(stash[stackIdx]!));
    }
    return maxSteps;
};

/**
 * Tier slots in a stack column.
 * @deprecated Prefer {@link localStashColumnStepSpan}; kept for tests.
 */
export const localStashStackSlotLayers = (stack: string[]): number => {
    return localStashColumnStepSpan(stack);
};

/** @deprecated Use {@link localStashStackSlotLayers}; kept for tests naming clarity. */
export const localStashStackLayersAboveBottom = localStashStackSlotLayers;

/** @deprecated Use {@link localStashRowMaxSteps}; row band height should use {@link localStashRowStackSpanPx}. */
export const localStashRowMaxLayers = (stash: string[][], row: number[]): number => {
    let maxLayers = 0;
    for (const stackIdx of row) {
        maxLayers = Math.max(maxLayers, localStashStackSlotLayers(stash[stackIdx]!));
    }
    return maxLayers;
};
