import { expect } from "chai";
import "mocha";
import { render, type APRenderRep } from "../src/index.js";
import { coreRenderOptions, makeDraw } from "./helpers/renderTestDraw.js";

function countHaloSegmentClasses(svg: string): number {
    const re = /class="[^"]*aprender-marker-[^"]*-segment(\d+)/g;
    const ids = new Set<number>();
    let m: RegExpExecArray | null;
    while ((m = re.exec(svg)) !== null) {
        ids.add(parseInt(m[1]!, 10));
    }
    return ids.size;
}

function haloStrokeSegments(svg: string): boolean {
    return /id="[^"]+-markers"[^>]*>[\s\S]*aprender-marker-[^"]*-segment[\s\S]*?fill="none"/.test(svg)
        || /aprender-marker-[^"]*-segment\d+[^>]*fill="none"[^>]*stroke=/.test(svg);
}

describe("halo markers", () => {
    it("renders hex-of-hex halo as stroke arcs by default", () => {
        const rep: APRenderRep = {
            board: {
                style: "hex-of-hex",
                minWidth: 4,
                maxWidth: 5,
                markers: [{
                    type: "halo",
                    width: 4,
                    segments: [{ colour: 1 }, { colour: 2 }],
                }],
            },
            legend: { A: { name: "piece", paint: { fill: 1 } } },
            pieces: null,
        };
        const draw = makeDraw();
        render(rep, { ...coreRenderOptions, target: draw });
        const svg = draw.svg();
        expect(haloStrokeSegments(svg)).to.equal(true);
        expect(countHaloSegmentClasses(svg)).to.equal(2);
    });

    it("renders hex-of-hex halo wedges when wedge is true", () => {
        const rep: APRenderRep = {
            board: {
                style: "hex-of-hex",
                minWidth: 4,
                maxWidth: 5,
                markers: [{
                    type: "halo",
                    wedge: true,
                    segments: [{ colour: 1 }, { colour: 2 }],
                }],
            },
            legend: { A: { name: "piece", paint: { fill: 1 } } },
            pieces: null,
        };
        const draw = makeDraw();
        render(rep, { ...coreRenderOptions, target: draw });
        const svg = draw.svg();
        expect(haloStrokeSegments(svg)).to.equal(false);
        expect(/aprender-marker-[^"]*-segment\d+[^>]*fill=/.test(svg)).to.equal(true);
        expect(countHaloSegmentClasses(svg)).to.equal(2);
    });

    it("renders equal-segment halos on circular-moon", () => {
        const rep: APRenderRep = {
            board: {
                style: "circular-moon",
                strokeWeight: 0.5,
                markers: [{
                    type: "halo",
                    width: 5,
                    segments: [{ colour: 1 }, { colour: 2 }, { colour: 3 }],
                }],
            },
            legend: { A: { name: "piece", paint: { fill: 1 } } },
            pieces: "AAAAA",
        };
        const draw = makeDraw();
        render(rep, { ...coreRenderOptions, target: draw });
        const svg = draw.svg();
        expect(countHaloSegmentClasses(svg)).to.equal(3);
    });

    it("renders conical-hex halo with two segments", () => {
        const rep: APRenderRep = {
            board: {
                style: "conical-hex",
                height: 14,
                markers: [{
                    type: "halo",
                    width: 10,
                    segments: [{ colour: 1 }, { colour: 2 }],
                }],
            },
            legend: {},
            pieces: null,
        };
        const draw = makeDraw();
        render(rep, { ...coreRenderOptions, target: draw });
        expect(countHaloSegmentClasses(draw.svg())).to.equal(2);
    });

    it("renders bricka halo with variable degrees", () => {
        const rep: APRenderRep = {
            board: {
                style: "bricka",
                markers: [{
                    type: "halo",
                    width: 8,
                    offset: 0,
                    segments: [
                        { colour: 1, degrees: 80 },
                        { colour: 2, degrees: 80 },
                        { skip: true, degrees: 40 },
                        { colour: 1, degrees: 80 },
                        { colour: 2, degrees: 80 },
                    ],
                }],
            },
            legend: {
                A: { name: "piece", paint: { fill: 1 } },
                B: { name: "piece", paint: { fill: 2 } },
            },
            pieces: null,
        };
        const draw = makeDraw();
        render(rep, { ...coreRenderOptions, target: draw });
        expect(countHaloSegmentClasses(draw.svg())).to.equal(4);
    });

    it("bricka halo arc endpoints sit on the playfield circle", () => {
        const rep: APRenderRep = {
            board: {
                style: "bricka",
                markers: [{
                    type: "halo",
                    width: 10,
                    offset: -90,
                    segments: [
                        { colour: 1, degrees: 75 },
                        { colour: 2, degrees: 55 },
                        { skip: true, degrees: 25 },
                        { colour: 1, degrees: 75 },
                        { colour: 2, degrees: 55 },
                    ],
                }],
            },
            legend: {
                A: { name: "piece", paint: { fill: 1 } },
                B: { name: "piece", paint: { fill: 2 } },
            },
            pieces: null,
        };
        const draw = makeDraw();
        render(rep, { ...coreRenderOptions, target: draw });
        const svg = draw.svg();
        const pathRe = /id="gridlines-markers"[^>]*>([\s\S]*?)<\/g>\s*<g id="labels"/;
        const block = pathRe.exec(svg)?.[1] ?? "";
        const arcRe = /d="M([^,]+),([^ ]+) A ([^ ]+) ([^ ]+) \d+ \d+ \d+ ([^,]+),([^"]+)"/g;
        const radii: number[] = [];
        const cx = 300;
        const cy = 300;
        let m: RegExpExecArray | null;
        while ((m = arcRe.exec(block)) !== null) {
            const x1 = parseFloat(m[1]!);
            const y1 = parseFloat(m[2]!);
            const x2 = parseFloat(m[5]!);
            const y2 = parseFloat(m[6]!);
            radii.push(Math.hypot(x1 - cx, y1 - cy), Math.hypot(x2 - cx, y2 - cy));
        }
        expect(radii.length).to.be.greaterThan(0);
        const meanR = radii.reduce((a, b) => a + b, 0) / radii.length;
        for (const r of radii) {
            expect(Math.abs(r - meanR)).to.be.lessThan(2);
        }
        // Fourth drawn segment ends at offset −90 + 230° → table bearing 140° (SE).
        const seg4End = block.match(
            /<path[^>]*aprender-marker-[^"]*-segment4[^>]*d="M[^"]+ A [^"]+ ([^,]+),([^"]+)"/,
        ) ?? block.match(
            /<path[^>]*d="M[^"]+ A [^"]+ ([^,]+),([^"]+)"[^>]*aprender-marker-[^"]*-segment4/,
        );
        expect(seg4End).not.to.equal(null);
        const endX = parseFloat(seg4End![1]!);
        const endY = parseFloat(seg4End![2]!);
        expect(endX).to.be.greaterThan(cx);
        expect(endY).to.be.greaterThan(cy);
    });
});
