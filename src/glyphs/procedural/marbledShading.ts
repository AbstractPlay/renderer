import type { Element as SVGElement, Symbol as SVGSymbol } from "@svgdotjs/svg.js";
import convert from "color-convert";
import fnv from "fnv-plus";
import { lighten } from "../../common/colours.js";

const convert_rgb = convert.rgb;
const convert_hex = convert.hex;

export const MARBLED_SHADING_PROFILE = "piece-marbled";

export function isMarbledShadingProfile(profile: string): boolean {
    return profile === MARBLED_SHADING_PROFILE;
}

function marbledHex(baseHex: string, ds: number, dl: number): string {
    const rgb = convert_hex.rgb(baseHex);
    const col = lighten(rgb, ds, dl);
    return "#" + convert_rgb.hex(col);
}

function gradientIdSuffix(baseHex: string): string {
    fnv.seed("aprender_marbled");
    return fnv.hash(baseHex).hex();
}

/**
 * Procedural checker-disc shading: one player `fill` drives face gradient and dark edge.
 * Fixed speckle/vein markup stays authored on the symbol.
 */
export function applyProceduralMarbledPaint(got: SVGSymbol, baseHex: string): void {
    const hash = gradientIdSuffix(baseHex);
    const faceGrad = got.gradient("linear", (add) => {
        add.stop({ offset: 0, color: marbledHex(baseHex, 0, 0.45) });
        add.stop({ offset: 0.5, color: baseHex });
        add.stop({ offset: 1, color: marbledHex(baseHex, 0, -0.25) });
    });
    faceGrad.attr({
        x1: 0,
        y1: 0,
        x2: "75%",
        y2: "100%",
        gradientUnits: "objectBoundingBox",
    });
    faceGrad.id(`linearGradient-marbled-${hash}`);

    const sideHex = marbledHex(baseHex, 0.1, -0.9);

    got.find('[data-slot-fill="fill"]').each(function (this: SVGElement) {
        this.fill(faceGrad);
    });
    got.find("[data-marbled-side]").each(function (this: SVGElement) {
        this.fill(sideHex);
    });
}
