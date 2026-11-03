import { expect } from "chai";
import "mocha";
import Ajv from "ajv";
import { Element as SVGElement, SVG, registerWindow, Svg } from "@svgdotjs/svg.js";
import { createSVGWindow } from "svgdom";
import { DefaultRenderer } from "../src/renderers/default.js";
import type { IRendererOptionsIn } from "../src/renderers/_base.js";
import type { APRenderRep } from "../src/schemas/schema.js";
import schema from "../src/schemas/schema.json" with { type: "json" };

const makeDraw = (): Svg => {
    const window = createSVGWindow();
    registerWindow(window, window.document);
    return SVG(window.document.documentElement) as Svg;
};

const baseOptions: IRendererOptionsIn = {
    contextGlobal: true,
    coloursGlobal: false,
    showAnnotations: false,
    sheets: ["core"],
};

const symbolRectFill = (draw: Svg, symbolId: string): { fill: string; opacity: number } => {
    const rect = draw.findOne(`#${symbolId} rect`) as SVGElement;
    expect(rect).to.not.equal(undefined);
    const fill = rect.attr("fill") ?? "";
    const opacity = parseFloat(rect.attr("fill-opacity") ?? rect.attr("opacity") ?? "1");
    return { fill, opacity };
};

describe("checkered board colours", () => {
    it("accepts checkeredLight and checkeredDark on board schema", () => {
        const ajv = new Ajv({ allErrors: true, strict: false });
        const validate = ajv.compile(schema);
        const rep: APRenderRep = {
            board: {
                style: "squares-checkered",
                width: 2,
                height: 2,
                checkeredLight: "#eeeed2",
                checkeredDark: "#769656",
            },
            legend: {},
            pieces: "--\n--",
        };
        expect(validate(rep)).to.equal(true);
        expect(validate({
            board: {
                style: "squares-checkered",
                width: 2,
                height: 2,
                checkeredLight: null,
                checkeredDark: null,
            },
            legend: {},
            pieces: "--\n--",
        })).to.equal(true);
        expect(validate({
            board: {
                style: "squares-diamonds-checkered",
                width: 2,
                height: 2,
                checkeredLight: "#eeeed2",
                checkeredDark: "#769656",
            },
            legend: {},
            pieces: "--\n--",
        })).to.equal(true);
    });

    it("uses explicit light and dark fills at full opacity", () => {
        const draw = makeDraw();
        const renderer = new DefaultRenderer();
        const rep: APRenderRep = {
            board: {
                style: "squares-checkered",
                width: 2,
                height: 2,
                checkeredLight: "#eeeed2",
                checkeredDark: "#769656",
            },
            legend: { P: { name: "piece", paint: { fill: 1 } } },
            pieces: "--\n--",
        };
        renderer.render(rep, draw, baseOptions);

        const light = symbolRectFill(draw, "tile-light");
        const dark = symbolRectFill(draw, "tile-dark");
        expect(light.fill.toLowerCase()).to.equal("#eeeed2");
        expect(dark.fill.toLowerCase()).to.equal("#769656");
        expect(light.opacity).to.equal(1);
        expect(dark.opacity).to.equal(1);
    });

    it("ignores strokeOpacity for explicit checker fills", () => {
        const draw = makeDraw();
        const renderer = new DefaultRenderer();
        const rep: APRenderRep = {
            board: {
                style: "squares-checkered",
                width: 2,
                height: 2,
                checkeredLight: "#eeeed2",
                checkeredDark: "#769656",
                strokeOpacity: 0.35,
            },
            legend: { P: { name: "piece", paint: { fill: 1 } } },
            pieces: "--\n--",
        };
        renderer.render(rep, draw, baseOptions);

        const light = symbolRectFill(draw, "tile-light");
        const dark = symbolRectFill(draw, "tile-dark");
        expect(light.opacity).to.equal(1);
        expect(dark.opacity).to.equal(1);
    });

    it("falls back to legacy tint when explicit colours are null", () => {
        const draw = makeDraw();
        const renderer = new DefaultRenderer();
        const rep: APRenderRep = {
            board: {
                style: "squares-checkered",
                width: 2,
                height: 2,
                checkeredLight: null,
                checkeredDark: null,
            },
            legend: { P: { name: "piece", paint: { fill: 1 } } },
            pieces: "--\n--",
        };
        renderer.render(rep, draw, baseOptions);

        const light = symbolRectFill(draw, "tile-light");
        const dark = symbolRectFill(draw, "tile-dark");
        expect(light.opacity === 0 || dark.opacity === 0).to.equal(true);
        expect(light.opacity === 0.25 || dark.opacity === 0.25).to.equal(true);
    });

    it("draws markers above checkered tiles", () => {
        const draw = makeDraw();
        const renderer = new DefaultRenderer();
        const rep: APRenderRep = {
            board: {
                style: "squares-checkered",
                width: 2,
                height: 2,
                checkeredLight: "#eeeed2",
                checkeredDark: "#769656",
                markers: [{ type: "edge", edge: "N", colour: 1 }],
            },
            legend: { P: { name: "piece", paint: { fill: 1 } } },
            pieces: "--\n--",
        };
        renderer.render(rep, draw, baseOptions);

        const board = draw.findOne("#board") as SVGElement;
        const childIds = board.children().map((c) => c.id());
        expect(childIds.indexOf("tiles")).to.be.lessThan(childIds.indexOf("gridlines"));

        const markers = draw.findOne("#gridlines-markers") as SVGElement;
        expect(markers.children().length).to.be.greaterThan(0);
    });

    it("checkers octagon cells on squares-diamonds-checkered", () => {
        const draw = makeDraw();
        const renderer = new DefaultRenderer();
        const rep: APRenderRep = {
            board: {
                style: "squares-diamonds-checkered",
                width: 2,
                height: 2,
                checkeredLight: "#eeeed2",
                checkeredDark: "#769656",
            },
            legend: { P: { name: "piece", paint: { fill: 1 } } },
            pieces: "--\n--",
        };
        renderer.render(rep, draw, baseOptions);

        const fillLayer = draw.findOne("#gridlines-fill") as SVGElement;
        expect(fillLayer).to.not.equal(undefined);
        const fills = fillLayer.find("polygon").map((el) =>
            (el as SVGElement).attr("fill")?.toLowerCase() ?? "",
        );
        expect(fills.filter((f) => f === "#eeeed2").length).to.be.greaterThan(0);
        expect(fills.filter((f) => f === "#769656").length).to.be.greaterThan(0);
    });

    it("alternates octagon fills by column on squares-diamonds-checkered", () => {
        const draw = makeDraw();
        const renderer = new DefaultRenderer();
        const rep: APRenderRep = {
            board: {
                style: "squares-diamonds-checkered",
                width: 2,
                height: 2,
                checkeredLight: "#eeeed2",
                checkeredDark: "#769656",
            },
            legend: { P: { name: "piece", paint: { fill: 1 } } },
            pieces: "--\n--",
        };
        renderer.render(rep, draw, baseOptions);
        const fillLayer = draw.findOne("#gridlines-fill") as SVGElement;
        const octagonFills = fillLayer
            .find("polygon")
            .filter((el) => {
                const pts = (el as SVGElement).attr("points") ?? "";
                return pts.split(/\s+/).filter(Boolean).length === 8;
            })
            .map((el) => (el as SVGElement).attr("fill")?.toLowerCase() ?? "");
        expect(octagonFills.length).to.equal(4);
        expect(new Set(octagonFills).size).to.equal(2);
    });
});
