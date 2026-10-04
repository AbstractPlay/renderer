import { expect } from "chai";
import "mocha";
import { registerWindow, SVG, Svg } from "@svgdotjs/svg.js";
import { createSVGWindow } from "svgdom";
import type { Element as SVGElement } from "@svgdotjs/svg.js";
import { CoreSheet } from "../../src/sheets/contact/core.js";
import { ArimaaSheet } from "../../src/sheets/contact/arimaa.js";
import { ChessSheet } from "../../src/sheets/contact/chess.js";
import { DiceSheet } from "../../src/sheets/contact/dice.js";
import { DominoSheet } from "../../src/sheets/contact/dominoes.js";
import { LooneySheet } from "../../src/sheets/contact/looney.js";
import { DecktetSheet } from "../../src/sheets/contact/decktet.js";
import { GnosticaSheet } from "../../src/sheets/contact/gnostica.js";
import { StreetcarSheet } from "../../src/sheets/contact/streetcar.js";
import { NatoSheet } from "../../src/sheets/contact/nato.js";
import { ExperimentalSheet } from "../../src/sheets/contact/experimental.js";
import { PiecepackSheet } from "../../src/sheets/contact/piecepack.js";
import type { ISheet } from "../../src/sheets/ISheet.js";
import { catalogKey, getGlyphCatalog, resetGlyphCatalogFromModule } from "../../src/sheets/registry/glyphRegistry.js";
import { invokeGlyphBuild, getGlyphDefinitionMeta } from "../../src/sheets/registry/defineGlyph.js";
import { DUOTONE_FILL_BORDER_SLOTS } from "../../src/sheets/registry/duotoneGlyph.js";
import { isTwoArgGlyphBuild } from "../../src/sheets/registry/glyphDefinition.js";

const LEGACY_PLAYER_ATTRS = [
    "data-playerfill",
    "data-playerstroke",
    "data-playerfill2",
    "data-playerstroke2",
] as const;

const SHEETS_BY_NAME: Record<string, ISheet> = {
    core: CoreSheet,
    chess: ChessSheet,
    arimaa: ArimaaSheet,
    experimental: ExperimentalSheet,
    dice: DiceSheet,
    piecepack: PiecepackSheet,
    dominoes: DominoSheet,
    nato: NatoSheet,
    looney: LooneySheet,
    decktet: DecktetSheet,
    gnostica: GnosticaSheet,
    streetcar: StreetcarSheet,
};

const DUOTONE_SHEETS = new Set<string>(["chess", "arimaa", "experimental"]);

/** Every sheet that registers glyphs through defineGlyph (post Phase B5). */
const SLOTTED_SHEET_NAMES = [
    "core",
    "chess",
    "arimaa",
    "experimental",
    "dice",
    "piecepack",
    "dominoes",
    "nato",
    "looney",
    "decktet",
    "gnostica",
    "streetcar",
] as const;

type SlottedSheetName = (typeof SLOTTED_SHEET_NAMES)[number];

function buildSheetGlyph(sheetName: string, name: string) {
    const window = createSVGWindow();
    registerWindow(window, window.document);
    const canvas = SVG(window.document.documentElement) as Svg;
    const sheet = SHEETS_BY_NAME[sheetName];
    expect(sheet, `unknown sheet ${sheetName}`).to.not.equal(undefined);
    const build = sheet.glyphs.get(name);
    expect(build, `missing glyph ${sheetName}:${name}`).to.not.equal(undefined);
    return invokeGlyphBuild(build!, canvas.defs() as Svg);
}

function legacyAttrOnSymbol(symbol: { find: (sel: string) => { each: (fn: (this: SVGElement) => void) => void } }): string | undefined {
    for (const attr of LEGACY_PLAYER_ATTRS) {
        let found: string | undefined;
        symbol.find(`[${attr}]`).each(function (this: SVGElement) {
            const v = this.attr(attr);
            if (v !== null && v !== undefined && v !== false) {
                found = attr;
            }
        });
        if (found !== undefined) {
            return found;
        }
    }
    return undefined;
}

function slotNamesOnSymbol(symbol: ReturnType<typeof buildSheetGlyph>): Set<string> {
    const slots = new Set<string>();
    symbol.find("[data-slot-fill]").each(function (this: SVGElement) {
        const v = this.attr("data-slot-fill");
        if (v !== null && v !== undefined && v !== false) {
            slots.add(String(v));
        }
    });
    symbol.find("[data-slot-stroke]").each(function (this: SVGElement) {
        const v = this.attr("data-slot-stroke");
        if (v !== null && v !== undefined && v !== false) {
            slots.add(String(v));
        }
    });
    symbol.find("[data-slot]").each(function (this: SVGElement) {
        const v = this.attr("data-slot");
        if (v !== null && v !== undefined && v !== false) {
            slots.add(String(v));
        }
    });
    return slots;
}

function catalogGlyphNamesForSheet(sheetName: string): string[] {
    return Object.keys(getGlyphCatalog().glyphs)
        .filter((k) => k.startsWith(`${sheetName}:`))
        .map((k) => k.slice(sheetName.length + 1))
        .sort();
}

function assertGlyphMapMatchesCatalog(sheetName: SlottedSheetName): void {
    const sheet = SHEETS_BY_NAME[sheetName];
    const fromSheet = [...sheet.glyphs.keys()].sort();
    expect(catalogGlyphNamesForSheet(sheetName)).to.deep.equal(fromSheet);
}

function assertSlotsMatchCatalog(sheetName: string, name: string, symbol: ReturnType<typeof buildSheetGlyph>): void {
    const used = slotNamesOnSymbol(symbol);
    const entry = getGlyphCatalog().glyphs[catalogKey(sheetName, name)];
    expect(entry, `catalog entry for ${sheetName}:${name}`).to.not.equal(undefined);
    for (const slot of used) {
        expect(entry!.slots[slot], `catalog slot ${slot} for ${sheetName}:${name}`).to.not.equal(undefined);
    }
}

/** Legacy-free build + catalog slot parity (shared by all slotted sheets). */
function assertSlottedGlyphBasics(
    sheetName: SlottedSheetName,
    name: string,
): ReturnType<typeof buildSheetGlyph> {
    const symbol = buildSheetGlyph(sheetName, name);
    expect(legacyAttrOnSymbol(symbol), `${sheetName}:${name} legacy player attrs`).to.equal(undefined);
    assertSlotsMatchCatalog(sheetName, name, symbol);
    return symbol;
}

function assertDuotoneRegistry(sheetName: SlottedSheetName, name: string, symbol: ReturnType<typeof buildSheetGlyph>): void {
    const meta = getGlyphDefinitionMeta(sheetName, name);
    expect(meta?.slots?.fill, `${sheetName}:${name} fill slot`).to.not.equal(undefined);

    if (sheetName === "experimental") {
        expect(meta?.colour2Slot).to.equal("border");
        expect(meta?.slots?.fill?.channels).to.deep.equal(DUOTONE_FILL_BORDER_SLOTS.fill.channels);
        expect(meta?.slots?.border?.channels).to.deep.equal(DUOTONE_FILL_BORDER_SLOTS.border.channels);
    }

    const colour2Slot = meta?.colour2Slot ?? "border";
    if (colour2Slot === "border") {
        symbol.find('[data-slot-fill="detail"]').each(function (this: SVGElement) {
            expect.fail(`unexpected detail fill on ${sheetName}:${name}`);
        });
        symbol.find('[data-slot-stroke="detail"]').each(function (this: SVGElement) {
            expect.fail(`unexpected detail stroke on ${sheetName}:${name}`);
        });
        expect(meta?.slots?.border, `${sheetName}:${name} border slot`).to.not.equal(undefined);
    } else {
        expect(colour2Slot, `${sheetName}:${name} colour2Slot`).to.equal("detail");
        expect(meta?.slots?.detail, `${sheetName}:${name} detail slot`).to.not.equal(undefined);
    }
}

function assertDiceRegistry(name: string, symbol: ReturnType<typeof buildSheetGlyph>): void {
    const meta = getGlyphDefinitionMeta("dice", name);
    expect(meta?.colour2Slot).to.equal("detail");
    expect(meta?.slots?.detail?.description).to.match(/pip/i);
    if (name !== "d6-empty") {
        symbol.find('[data-slot-fill="detail"]').each(function (this: SVGElement) {
            expect(this.node?.nodeName?.toLowerCase()).to.equal("circle");
        });
    }
    symbol.find('[data-slot-stroke="border"]').each(function (this: SVGElement) {
        expect(this.node?.nodeName?.toLowerCase()).to.equal("rect");
    });
}

function assertCatalogSheetRegistry(
    sheetName: SlottedSheetName,
    name: string,
    symbol: ReturnType<typeof buildSheetGlyph>,
): void {
    const meta = getGlyphDefinitionMeta(sheetName, name);
    if (meta?.paintMode === "fixed") {
        expect(meta.slots, `${sheetName}:${name} fixed glyph slots`).to.equal(undefined);
        return;
    }
    expect(meta?.slots?.fill, `${sheetName}:${name} registry`).to.not.equal(undefined);

    if (sheetName === "core") {
        if (meta?.paintMode === "proceduralShaded") {
            const build = CoreSheet.glyphs.get(name)!;
            expect(isTwoArgGlyphBuild(build)).to.equal(false);
            expect(meta.shadingProfile).to.equal(name === "orb" ? "orb" : name);
        }
        if (name === "orca") {
            expect(meta?.colour2Slot).to.equal("detail");
            expect(meta?.slots?.detail).to.not.equal(undefined);
            expect(meta?.slots?.border).to.equal(undefined);
        }
        if (name.startsWith("trax-")) {
            expect(meta?.colour2Slot).to.equal("detail");
            expect(meta?.slots?.detail?.channels).to.deep.equal(["stroke"]);
            expect(meta?.slots?.border).to.equal(undefined);
            expect(slotNamesOnSymbol(symbol).has("detail")).to.equal(true);
        }
        if (name === "plane") {
            expect(meta?.slots?.target?.channels).to.deep.equal(["fill"]);
            expect(slotNamesOnSymbol(symbol).has("target")).to.equal(true);
            expect(slotNamesOnSymbol(symbol).has("detail")).to.equal(true);
            expect(slotNamesOnSymbol(symbol).has("border")).to.equal(true);
        }
        return;
    }

    if (sheetName === "dominoes") {
        expect(meta?.slots?.border).to.equal(undefined);
        expect(meta?.slots?.detail).to.equal(undefined);
        symbol.find('[data-slot-fill="fill"]').each(function (this: SVGElement) {
            expect(this.node?.nodeName?.toLowerCase()).to.equal("circle");
        });
        return;
    }

    if (sheetName === "nato") {
        expect(meta?.colour2Slot).to.equal("border");
        expect(meta?.slots?.border?.channels).to.include("stroke");
        symbol.find('[data-slot-fill="fill"]').each(function (this: SVGElement) {
            expect(this.node?.nodeName?.toLowerCase()).to.equal("rect");
        });
        return;
    }

    if (sheetName === "gnostica") {
        expect(meta?.colour2Slot).to.equal("detail");
        expect(meta?.slots?.detail?.channels).to.deep.equal(["fill"]);
        expect(meta?.slots?.border?.channels).to.include("stroke");
        return;
    }

    if (sheetName === "looney") {
        if (meta?.slots?.border === undefined) {
            symbol.find('[data-slot-stroke="fill"]').each(function (this: SVGElement) {
                expect(this.node?.nodeName?.toLowerCase()).to.equal("polyline");
            });
        } else {
            expect(meta.colour2Slot).to.equal("border");
            expect(meta.slots.border?.channels).to.include("stroke");
        }
        return;
    }

    if (sheetName === "decktet") {
        if (meta?.slots?.border?.channels?.includes("fill")) {
            expect(meta.colour2Slot).to.equal("border");
            expect(slotNamesOnSymbol(symbol).has("border")).to.equal(true);
        } else {
            expect(meta?.slots?.border).to.equal(undefined);
            expect(slotNamesOnSymbol(symbol).has("border")).to.equal(false);
        }
        return;
    }

    if (sheetName === "piecepack") {
        if (meta?.colour2Slot === "detail") {
            expect(meta.slots?.detail).to.not.equal(undefined);
            expect(slotNamesOnSymbol(symbol).has("detail")).to.equal(true);
        } else if (meta?.slots?.border?.channels?.includes("fill")) {
            expect(meta.colour2Slot).to.equal("border");
            expect(slotNamesOnSymbol(symbol).has("border")).to.equal(true);
        } else {
            expect(meta?.colour2Slot).to.equal("border");
            expect(meta?.slots?.border?.channels).to.include("stroke");
        }
        return;
    }

    if (sheetName === "streetcar") {
        const used = slotNamesOnSymbol(symbol);
        expect(used.has("border")).to.equal(true);
    }
}

describe("sheet glyph slots", () => {
    before(() => {
        resetGlyphCatalogFromModule();
    });

    it("all slotted sheets: glyph maps match catalog", () => {
        for (const sheetName of SLOTTED_SHEET_NAMES) {
            assertGlyphMapMatchesCatalog(sheetName);
        }
    });

    for (const sheetName of SLOTTED_SHEET_NAMES) {
        describe(`${sheetName} sheet`, () => {
            const sheet = SHEETS_BY_NAME[sheetName];

            for (const name of sheet.glyphs.keys()) {
                it(`${sheetName}:${name}: slotted glyph contract`, () => {
                    const symbol = assertSlottedGlyphBasics(sheetName, name);

                    if (DUOTONE_SHEETS.has(sheetName)) {
                        assertDuotoneRegistry(sheetName, name, symbol);
                    } else if (sheetName === "dice") {
                        assertDiceRegistry(name, symbol);
                    } else {
                        assertCatalogSheetRegistry(sheetName, name, symbol);
                    }
                });
            }
        });
    }
});
