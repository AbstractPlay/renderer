/**
 * Slot paint audit: render each slotted glyph with paint.fill, paint.border, and paint.detail
 * set to player 1, then flag explicit fill/stroke that is not that colour.
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Element as SVGElement, Symbol as SVGSymbol } from "@svgdotjs/svg.js";
import { SVG, registerWindow, type Svg } from "@svgdotjs/svg.js";
import { createSVGWindow } from "svgdom";
import type { Colourfuncs, Gradient } from "../../schemas/schema.js";
import { paletteDefault } from "../../renderers/_base.js";
import {
    applySlotPaint,
    symbolHasSlotBindings,
    type GlyphPaintApplier,
    type NormalizedPaintMap,
} from "../../renderers/glyphPaint.js";
import { contactSheets } from "../contact/index.js";
import type { ISheet } from "../ISheet.js";
import { getGlyphDefinitionMeta, invokeGlyphBuild } from "./defineGlyph.js";
import {
    proceduralShadingProfile,
    resetGlyphCatalogFromModule,
    resolveColour2SlotForGlyph,
} from "./glyphRegistry.js";

/** Legend paint keys applied in the uniform audit (player index per slot). */
export const STANDARD_LEGEND_PAINT_SLOTS = ["fill", "border", "detail"] as const;

export type StandardLegendPaintSlot = (typeof STANDARD_LEGEND_PAINT_SLOTS)[number];

const DEFAULT_PLAYER_INDEX = 1;

type Channel = "fill" | "stroke";

interface GlyphPaintAuditHit {
    sheet: string;
    glyph: string;
    glyphKey: string;
    tag: string;
    channel: Channel;
    value: string;
    slotFill: string | null;
    slotStroke: string | null;
    slot: string | null;
    hint: string;
    category: string;
    reason: string;
}

export interface GlyphPaintAuditReport {
    generated: string;
    methodology: string;
    paintApplied: NormalizedPaintMap;
    expectedColour: string;
    standardPaintSlots: StandardLegendPaintSlot[];
    totalGlyphs: number;
    skippedGlyphs: number;
    glyphsAudited: number;
    nonUniformChannelHits: number;
    glyphsWithIssues: number;
    glyphsFullyUniform: number;
    byChannel: Record<Channel, number>;
    byCategory: Record<string, number>;
    bySheet: Record<string, number>;
    glyphs: Array<{ glyphKey: string; count: number; entries: GlyphPaintAuditHit[] }>;
}

export interface GlyphPaintAuditOptions {
    /** Optional local debug: write report JSON/MD and failure SVGs (not used in CI). */
    writeArtifacts?: boolean;
    artifactDir?: string;
    playerIndex?: number;
    sheets?: ISheet[];
}

export interface GlyphPaintAuditResult {
    ok: boolean;
    expectedColour: string;
    hitCount: number;
    report: GlyphPaintAuditReport;
}

/** Human-readable failure text for CI and tests (no file output). */
export function formatGlyphPaintAuditFailure(result: GlyphPaintAuditResult): string {
    const { report, expectedColour, hitCount } = result;
    const lines = [
        `Glyph paint audit failed: ${hitCount} non-uniform fill/stroke hit(s) on ${report.glyphsWithIssues} glyph(s).`,
        `Expected ${expectedColour} after paint.fill, paint.border, and paint.detail = player 1.`,
        "",
        "Offending glyphs:",
    ];
    for (const g of report.glyphs) {
        lines.push(`  - ${g.glyphKey} (${g.count} hit${g.count === 1 ? "" : "s"})`);
    }
    return lines.join("\n");
}

/** Runs the audit and throws if any glyph fails (default: no artifact files). */
export function assertGlyphPaintAuditClean(options: GlyphPaintAuditOptions = {}): GlyphPaintAuditResult {
    const result = runGlyphPaintAudit({ writeArtifacts: false, ...options });
    if (!result.ok) {
        throw new Error(formatGlyphPaintAuditFailure(result));
    }
    return result;
}

function sheetSearchOrder(sheetName: string, sheetNames: string[]): string[] {
    return [sheetName, ...sheetNames.filter((n) => n !== sheetName)];
}

function normalizePaintHex(val: string): string | null {
    const lower = val.toLowerCase().trim();
    if (lower === "black") {
        return "#000000";
    }
    if (lower === "white") {
        return "#ffffff";
    }
    if (!lower.startsWith("#")) {
        return null;
    }
    if (lower.length === 4) {
        return `#${lower[1]}${lower[1]}${lower[2]}${lower[2]}${lower[3]}${lower[3]}`;
    }
    return lower;
}

function matchesExpectedColour(val: string, expectedHex: string): boolean {
    const norm = normalizePaintHex(val);
    const exp = normalizePaintHex(expectedHex);
    if (norm === null || exp === null) {
        return false;
    }
    return norm === exp;
}

function isAuditSkippedGlyph(sheetName: string, glyphName: string): boolean {
    const meta = getGlyphDefinitionMeta(sheetName, glyphName);
    if (meta?.paintMode === "proceduralShaded" || meta?.paintMode === "fixed") {
        return true;
    }
    return proceduralShadingProfile(glyphName) !== undefined;
}

function slotChannelAudited(
    slotName: string | null,
    paintedSlots: ReadonlySet<string>,
): boolean {
    if (slotName === null) {
        return true;
    }
    return paintedSlots.has(slotName);
}

function createPaintApplier(palette: string[]): GlyphPaintApplier {
    return {
        resolveFill: (val: number | string | Gradient | Colourfuncs, def = palette[0]!) => {
            if (typeof val === "number") {
                return palette[val - 1] ?? def;
            }
            if (typeof val === "string") {
                return val;
            }
            return def;
        },
        applyPlayerFillTargets(got, suffix, fill, opacity) {
            const fillAttr = `data-playerfill${suffix}`;
            const strokeAttr = `data-playerstroke${suffix}`;
            if (typeof fill === "object" && fill !== null && !Array.isArray(fill)) {
                got.find(`[${fillAttr}=true]`).each(function (this: SVGElement) {
                    this.fill(fill);
                });
                return;
            }
            const colour = typeof fill === "string" ? fill : palette[0]!;
            got.find(`[${fillAttr}=true]`).each(function (this: SVGElement) {
                this.fill({ color: colour, opacity });
            });
            got.find(`[${strokeAttr}=true]`).each(function (this: SVGElement) {
                this.stroke({ color: colour, opacity });
            });
        },
        isPatternSVGElement: () => false,
    };
}

function paintedGlyphSymbol(
    sheet: ISheet,
    glyphName: string,
    sheetNames: string[],
    slotPaint: NormalizedPaintMap,
): SVGSymbol {
    const window = createSVGWindow();
    registerWindow(window, window.document);
    const canvas = SVG(window.document.documentElement) as Svg;
    const build = sheet.glyphs.get(glyphName);
    if (build === undefined) {
        throw new Error(`missing glyph ${sheet.name}:${glyphName}`);
    }
    const got = invokeGlyphBuild(build, canvas.defs() as Svg);
    const search = sheetSearchOrder(sheet.name, sheetNames);
    const colour2Slot = resolveColour2SlotForGlyph(glyphName, search);
    const palette = paletteDefault;
    const applier = createPaintApplier(palette);
    const slotted = symbolHasSlotBindings(got);

    let sheetCellSize = got.viewbox().height;
    if (sheetCellSize === null || sheetCellSize === undefined) {
        const raw = got.attr("data-cellsize");
        sheetCellSize = typeof raw === "number" ? raw : Number(raw) || 100;
    }

    applySlotPaint(got, slotPaint, applier, {
        sheetCellSize,
        colour2Slot,
        slotted,
    });
    return got;
}

function attrString(el: SVGElement, name: string): string | null {
    const v = el.attr(name);
    if (v === null || v === undefined || v === false) {
        return null;
    }
    return String(v);
}

function presentationAttr(el: SVGElement, name: string): string | null {
    const node = el.node as Element | undefined;
    if (node === undefined || typeof node.getAttribute !== "function") {
        return null;
    }
    const v = node.getAttribute(name);
    if (v === null || v === "") {
        return null;
    }
    return v;
}

function hasExplicitPaint(val: string | null): val is string {
    if (val === null) {
        return false;
    }
    const lower = val.toLowerCase().trim();
    return lower !== "" && lower !== "none" && lower !== "transparent";
}

function classifyColor(val: string): string {
    const lower = val.toLowerCase();
    if (lower === "#000" || lower === "#000000" || lower === "black") {
        return "fixedBlack";
    }
    if (lower === "#fff" || lower === "#ffffff" || lower === "white") {
        return "fixedWhite";
    }
    if (lower.startsWith("url(")) {
        return "urlRef";
    }
    return "other";
}

function elementHint(el: SVGElement): string {
    const d = attrString(el, "d");
    if (d !== null) {
        return `path d=${d.slice(0, 48)}${d.length > 48 ? "…" : ""}`;
    }
    const id = attrString(el, "id");
    if (id !== null) {
        return `id=${id}`;
    }
    const points = attrString(el, "points");
    if (points !== null) {
        return `points=${points.slice(0, 40)}…`;
    }
    const r = attrString(el, "r");
    const cx = attrString(el, "cx");
    if (r !== null && cx !== null) {
        return `circle r=${r} cx=${cx}`;
    }
    return el.node?.nodeName?.toLowerCase() ?? "element";
}

function strokeIsVisible(el: SVGElement): boolean {
    const stroke = presentationAttr(el, "stroke");
    if (!hasExplicitPaint(stroke)) {
        return false;
    }
    const w = presentationAttr(el, "stroke-width");
    if (w === null || w === "") {
        return true;
    }
    const n = parseFloat(w);
    if (Number.isNaN(n)) {
        return true;
    }
    return n > 0;
}

function scanNonUniformInk(
    el: SVGElement,
    sheetName: string,
    glyphName: string,
    expectedHex: string,
    playerIndex: number,
    paintedSlots: ReadonlySet<string>,
    out: GlyphPaintAuditHit[],
): void {
    const tag = el.node?.nodeName?.toLowerCase() ?? "?";

    if (tag === "defs" || tag === "mask") {
        return;
    }

    if (tag === "symbol") {
        el.each(function (this: SVGElement) {
            scanNonUniformInk(this, sheetName, glyphName, expectedHex, playerIndex, paintedSlots, out);
        });
        return;
    }

    const fill = presentationAttr(el, "fill");
    const stroke = presentationAttr(el, "stroke");
    const glyphKey = `${sheetName}:${glyphName}`;
    const slotFill = attrString(el, "data-slot-fill");
    const slotStroke = attrString(el, "data-slot-stroke");
    const slot = attrString(el, "data-slot");
    const expectedLabel = `player ${playerIndex} (${expectedHex})`;

    const fillSlot = slotFill ?? slot;
    const strokeSlot = slotStroke ?? slot;

    if (
        hasExplicitPaint(fill)
        && slotChannelAudited(fillSlot, paintedSlots)
        && !matchesExpectedColour(fill, expectedHex)
    ) {
        out.push({
            sheet: sheetName,
            glyph: glyphName,
            glyphKey,
            tag,
            channel: "fill",
            value: fill,
            slotFill,
            slotStroke,
            slot,
            hint: elementHint(el),
            category: classifyColor(fill),
            reason:
                `fill is not ${expectedLabel} after paint.${STANDARD_LEGEND_PAINT_SLOTS.join("/")}: ${playerIndex}`,
        });
    }

    if (
        strokeIsVisible(el)
        && stroke !== null
        && slotChannelAudited(strokeSlot, paintedSlots)
        && !matchesExpectedColour(stroke, expectedHex)
    ) {
        out.push({
            sheet: sheetName,
            glyph: glyphName,
            glyphKey,
            tag,
            channel: "stroke",
            value: stroke,
            slotFill,
            slotStroke,
            slot,
            hint: elementHint(el),
            category: classifyColor(stroke),
            reason:
                `stroke is not ${expectedLabel} after paint.${STANDARD_LEGEND_PAINT_SLOTS.join("/")}: ${playerIndex}`,
        });
    }

    el.each(function (this: SVGElement) {
        scanNonUniformInk(this, sheetName, glyphName, expectedHex, playerIndex, paintedSlots, out);
    });
}

function symbolInnerMarkup(symbol: SVGSymbol): string {
    const full = symbol.svg();
    const match = full.match(/^<symbol(?:\s[^>]*)?>([\s\S]*)<\/symbol>\s*$/i);
    if (match !== null) {
        return match[1]!;
    }
    return full;
}

function standaloneSvgDocument(symbol: SVGSymbol): string {
    const vb = symbol.viewbox();
    let x = 0;
    let y = 0;
    let w = 100;
    let h = 100;
    if (vb.width !== null && vb.width !== undefined && vb.height !== null && vb.height !== undefined) {
        x = vb.x ?? 0;
        y = vb.y ?? 0;
        w = vb.width;
        h = vb.height;
    }
    const pad = Math.max(w, h) * 0.05;
    const viewBox = `${x - pad} ${y - pad} ${w + pad * 2} ${h + pad * 2}`;
    const inner = symbolInnerMarkup(symbol);
    return (
        `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ` +
        `viewBox="${viewBox}">\n` +
        `<rect x="${x - pad}" y="${y - pad}" width="${w + pad * 2}" height="${h + pad * 2}" fill="#ffffff"/>\n` +
        `${inner}\n` +
        `</svg>\n`
    );
}

function buildReport(
    hits: GlyphPaintAuditHit[],
    totalGlyphs: number,
    skippedGlyphs: number,
    expectedHex: string,
    playerIndex: number,
    slotPaint: NormalizedPaintMap,
): GlyphPaintAuditReport {
    const byGlyph = new Map<string, GlyphPaintAuditHit[]>();
    for (const e of hits) {
        const list = byGlyph.get(e.glyphKey) ?? [];
        list.push(e);
        byGlyph.set(e.glyphKey, list);
    }

    const byCategory: Record<string, number> = {};
    const bySheet: Record<string, number> = {};
    const byChannel: Record<Channel, number> = { fill: 0, stroke: 0 };
    for (const e of hits) {
        byCategory[e.category] = (byCategory[e.category] ?? 0) + 1;
        bySheet[e.sheet] = (bySheet[e.sheet] ?? 0) + 1;
        byChannel[e.channel] += 1;
    }

    const glyphsAudited = totalGlyphs - skippedGlyphs;
    const slotList = STANDARD_LEGEND_PAINT_SLOTS.join(", ");

    return {
        generated: new Date().toISOString(),
        methodology:
            `Render each glyph with paint.${slotList} set to player ${playerIndex}; ` +
            `flag elements whose own fill/stroke presentation attributes are not ${expectedHex}. ` +
            "Inherited paint on nodes without fill/stroke attrs is OK. " +
            "Skipped: `paintMode: fixed`, procedural orbs. " +
            "Elements bound to catalog slots outside fill/border/detail keep authored colours " +
            "(optional bespoke slots such as `target` are not recoloured in this check).",
        paintApplied: slotPaint,
        expectedColour: expectedHex,
        standardPaintSlots: [...STANDARD_LEGEND_PAINT_SLOTS],
        totalGlyphs,
        skippedGlyphs,
        glyphsAudited,
        nonUniformChannelHits: hits.length,
        glyphsWithIssues: byGlyph.size,
        glyphsFullyUniform: glyphsAudited - byGlyph.size,
        byChannel,
        byCategory,
        bySheet,
        glyphs: [...byGlyph.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, list]) => ({
                glyphKey: key,
                count: list.length,
                entries: list,
            })),
    };
}

function reportMarkdown(report: GlyphPaintAuditReport, playerIndex: number): string {
    const lines: string[] = [
        "# Glyph paint slot audit",
        "",
        report.methodology,
        "",
        `**Expected colour:** \`${report.expectedColour}\` (player ${playerIndex})`,
        `**Paint applied:** \`${JSON.stringify(report.paintApplied)}\``,
        `**Catalog glyphs:** ${report.totalGlyphs}`,
        `**Skipped (fixed / procedural):** ${report.skippedGlyphs}`,
        `**Glyphs audited:** ${report.glyphsAudited}`,
        `**Glyphs fully uniform:** ${report.glyphsFullyUniform}`,
        `**Glyphs with issues:** ${report.glyphsWithIssues}`,
        `**Non-uniform hits:** ${report.nonUniformChannelHits}`,
        "",
        "## By channel",
        "",
    ];

    for (const [ch, count] of Object.entries(report.byChannel)) {
        lines.push(`- ${ch}: ${count}`);
    }

    lines.push("", "## By sheet", "");
    if (Object.keys(report.bySheet).length === 0) {
        lines.push("- _(none)_");
    } else {
        for (const [sheet, count] of Object.entries(report.bySheet).sort((a, b) => b[1] - a[1])) {
            lines.push(`- \`${sheet}\`: ${count}`);
        }
    }

    lines.push("", "## Per glyph", "");
    if (report.glyphs.length === 0) {
        lines.push("_No issues found._", "");
    } else {
        for (const g of report.glyphs) {
            lines.push(`### \`${g.glyphKey}\` (${g.count})`, "");
            for (const e of g.entries) {
                lines.push(`- **${e.channel}** \`${e.value}\` — ${e.reason} — \`${e.tag}\` — ${e.hint}`);
            }
            lines.push("");
        }
    }

    return lines.join("\n");
}

function writeAuditArtifacts(
    artifactRoot: string,
    report: GlyphPaintAuditReport,
    playerIndex: number,
): void {
    rmSync(artifactRoot, { recursive: true, force: true });
    mkdirSync(artifactRoot, { recursive: true });

    writeFileSync(join(artifactRoot, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
    writeFileSync(join(artifactRoot, "report.md"), reportMarkdown(report, playerIndex), "utf8");
}

/**
 * Run the uniform slot-paint audit across contact sheets.
 */
export function runGlyphPaintAudit(options: GlyphPaintAuditOptions = {}): GlyphPaintAuditResult {
    resetGlyphCatalogFromModule();

    const playerIndex = options.playerIndex ?? DEFAULT_PLAYER_INDEX;
    const sheets = options.sheets ?? contactSheets;
    const sheetNames = sheets.map((s) => s.name);
    const expectedHex = paletteDefault[playerIndex - 1]!;
    const slotPaint: NormalizedPaintMap = {
        fill: playerIndex,
        border: playerIndex,
        detail: playerIndex,
    };
    const paintedSlots = new Set<string>(STANDARD_LEGEND_PAINT_SLOTS);

    let totalGlyphs = 0;
    let skippedGlyphs = 0;
    const hits: GlyphPaintAuditHit[] = [];

    const writeArtifactsFlag = options.writeArtifacts ?? false;
    const artifactRoot = options.artifactDir ?? join(process.cwd(), ".test-artifacts", "glyph-paint-audit");
    const failureDir = join(artifactRoot, "failures");

    for (const sheet of sheets) {
        totalGlyphs += sheet.glyphs.size;
        for (const glyphName of sheet.glyphs.keys()) {
            if (isAuditSkippedGlyph(sheet.name, glyphName)) {
                skippedGlyphs += 1;
                continue;
            }

            const symbol = paintedGlyphSymbol(sheet, glyphName, sheetNames, slotPaint);
            const glyphHits: GlyphPaintAuditHit[] = [];
            scanNonUniformInk(
                symbol as unknown as SVGElement,
                sheet.name,
                glyphName,
                expectedHex,
                playerIndex,
                paintedSlots,
                glyphHits,
            );
            hits.push(...glyphHits);

            if (writeArtifactsFlag && glyphHits.length > 0) {
                const sheetDir = join(failureDir, sheet.name);
                mkdirSync(sheetDir, { recursive: true });
                const rel = join("failures", sheet.name, `${glyphName}.svg`);
                writeFileSync(join(artifactRoot, rel), standaloneSvgDocument(symbol), "utf8");
            }
        }
    }

    hits.sort((a, b) => a.glyphKey.localeCompare(b.glyphKey) || a.channel.localeCompare(b.channel));

    const report = buildReport(hits, totalGlyphs, skippedGlyphs, expectedHex, playerIndex, slotPaint);

    if (writeArtifactsFlag) {
        writeAuditArtifacts(artifactRoot, report, playerIndex);
    }

    return {
        ok: hits.length === 0,
        expectedColour: expectedHex,
        hitCount: hits.length,
        report,
    };
}
