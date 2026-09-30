import { expect } from "chai";
import { render, type APRenderRep } from "../src/index.js";
import { buttonBarGlyphAllowance, buttonBarLabelCenterX } from "../src/common/buttonBar.js";
import { coreRenderOptions, makeDraw } from "./helpers/renderTestDraw.js";

const baseRep = (): APRenderRep => ({
    board: { style: "squares", width: 4, height: 4 },
    legend: {
        P: { name: "piece-square", colour: 1 },
        Q: { name: "piece-square", colour: 2 },
    },
    pieces: "----\n----\n----\n----",
    areas: [
        {
            type: "buttonBar",
            position: "right",
            buttons: [
                { label: "plain" },
                { label: "with-icon", glyph: "P", glyphPosition: "prefix" },
                { label: "after", glyph: "Q", glyphPosition: "suffix" },
                { glyph: "Q", glyphPosition: "suffix", value: "glyph-only" },
            ],
        },
    ],
});

describe("button bar legend glyphs", () => {
    it("references legend defs and widens the bar when glyphs are present", () => {
        const draw = makeDraw();
        render(baseRep(), { ...coreRenderOptions, target: draw });
        const bar = draw.findOne("#_btnBar");
        expect(bar).to.not.equal(null);
        const svg = draw.svg();
        expect(svg).to.match(/href="#P"|xlink:href="#P"/);
        expect(svg).to.match(/href="#Q"|xlink:href="#Q"/);

        const drawTextOnly = makeDraw();
        const textOnly: APRenderRep = {
            ...baseRep(),
            areas: [
                {
                    type: "buttonBar",
                    position: "right",
                    buttons: [{ label: "plain" }],
                },
            ],
        };
        render(textOnly, { ...coreRenderOptions, target: drawTextOnly });
        const barWidth = (draw.findOne("#_btnBar") as { viewbox(): { w: number } }).viewbox().w;
        const textOnlyWidth = (drawTextOnly.findOne("#_btnBar") as { viewbox(): { w: number } }).viewbox().w;
        expect(barWidth).to.be.greaterThan(textOnlyWidth);

        const prefixBtn = draw.findOne("#_btn_with-icon")!;
        const suffixBtn = draw.findOne("#_btn_after")!;
        const prefixUses = prefixBtn.find("use");
        const suffixUses = suffixBtn.find("use");
        const prefixLabel = prefixUses[1];
        const prefixGlyph = prefixUses[2];
        const suffixLabel = suffixUses[1];
        const suffixGlyph = suffixUses[2];
        const btnHeight = prefixUses[0].height() as number;
        const btnWidth = prefixUses[0].width() as number;
        const allowance = buttonBarGlyphAllowance(btnHeight);
        const useCenterX = (u: { x(): number; width(): number }): number =>
            u.x() + (u.width() as number) / 2;
        const labelCx = useCenterX(prefixLabel);
        const prefixGlyphCx = useCenterX(prefixGlyph);
        const suffixGlyphCx = useCenterX(suffixGlyph);
        expect(labelCx).to.be.closeTo(
            buttonBarLabelCenterX(btnWidth, btnHeight, "prefix", true),
            btnHeight * 0.08,
        );
        expect(labelCx).to.be.greaterThan(allowance);
        expect(prefixGlyphCx).to.be.lessThan(labelCx);
        const suffixLabelCx = useCenterX(suffixLabel);
        expect(suffixGlyphCx).to.be.greaterThan(suffixLabelCx);
        expect(suffixLabelCx).to.be.closeTo(
            buttonBarLabelCenterX(btnWidth, btnHeight, "suffix", true),
            btnHeight * 0.08,
        );

        const drawLarge = makeDraw();
        const largeScale: APRenderRep = {
            ...baseRep(),
            areas: [
                {
                    type: "buttonBar",
                    position: "right",
                    buttons: [{ label: "x", glyph: "P", glyphScale: 1 }],
                },
            ],
        };
        const drawSmall = makeDraw();
        const smallScale: APRenderRep = { ...largeScale, areas: [{ ...largeScale.areas![0], buttons: [{ label: "x", glyph: "P", glyphScale: 0.4 }] }] };
        render(largeScale, { ...coreRenderOptions, target: drawLarge });
        render(smallScale, { ...coreRenderOptions, target: drawSmall });
        const largeGlyph = drawLarge.findOne("#_btn_x")!.find("use").filter((u) => {
            const href = (u.attr("href") ?? u.attr("xlink:href") ?? "") as string;
            return href.includes("#P");
        })[0]!;
        const smallGlyph = drawSmall.findOne("#_btn_x")!.find("use").filter((u) => {
            const href = (u.attr("href") ?? u.attr("xlink:href") ?? "") as string;
            return href.includes("#P");
        })[0]!;
        expect(largeGlyph.rbox(drawLarge.findOne("#_btn_x")!).width).to.be.greaterThan(
            smallGlyph.rbox(drawSmall.findOne("#_btn_x")!).width,
        );

        expect(draw.findOne("#_btn_glyph-only")).to.not.equal(null);
    });
});
