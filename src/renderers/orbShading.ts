import type { Element as SVGElement, Symbol as SVGSymbol } from "@svgdotjs/svg.js";
import convert from "color-convert";
import fnv from "fnv-plus";
import { lighten } from "../common/colours.js";
import { findBindings } from "./glyphPaint.js";

const convert_rgb = convert.rgb;
const convert_hex = convert.hex;

export type OrbShadingProfile = "orb" | "orb1" | "orb2" | "orb3";

export function isOrbShadingProfile(profile: string): profile is OrbShadingProfile {
    return profile === "orb" || profile === "orb1" || profile === "orb2" || profile === "orb3";
}

export function orbGradientStopColours(baseHex: string): { highlight: string; shadow: string } {
    const rgb = convert_hex.rgb(baseHex);
    let col = lighten(rgb, 3, 1);
    const highlight = "#" + convert_rgb.hex(col[0], col[1], col[2]);
    col = lighten(rgb, 4, -1);
    const shadow = "#" + convert_rgb.hex(col[0], col[1], col[2]);
    return { highlight, shadow };
}

export function orbDetailHighlightColour(baseHex: string): string {
    const rgb = convert_hex.rgb(baseHex);
    const col = lighten(rgb, 3, 2.5);
    return "#" + convert_rgb.hex(col[0], col[1], col[2]);
}

function gradientIdSuffix(baseHex: string, seed: string): string {
    fnv.seed(seed);
    return fnv.hash(baseHex).hex();
}

function applyFillToSlot(got: SVGSymbol, slot: string, fill: string | ReturnType<SVGSymbol["gradient"]>): void {
    const { fill: fillSels } = findBindings(slot, "border");
    for (const sel of fillSels) {
        if (sel.startsWith("[data-playerfill") || sel.startsWith("[data-context-border-fill")) {
            continue;
        }
        got.find(sel).each(function (this: SVGElement) {
            if (typeof fill === "string") {
                this.fill(fill);
            } else {
                this.fill(fill);
            }
        });
    }
}

/**
 * Apply shaded-sphere paint for orb family glyphs (geometry must be built one-arg in core sheet).
 */
export function applyProceduralShadedPaint(
    got: SVGSymbol,
    profile: OrbShadingProfile,
    baseHex: string,
    detailOverrideHex?: string,
): void {
    const { highlight, shadow } = orbGradientStopColours(baseHex);
    const hash = gradientIdSuffix(baseHex, profile === "orb" ? "aprender_orb4" : profile === "orb1" ? "aprender_orb1" : profile === "orb3" ? "aprender_orb3" : "aprender");

    const mainGrad = got.gradient("radial", (add) => {
        add.stop({ offset: 0, color: highlight });
        add.stop({ offset: 1, color: shadow });
    });

    if (profile === "orb" || profile === "orb3") {
        mainGrad.attr({
            cx: 273,
            cy: 202,
            r: 310,
            fx: 315,
            fy: 142,
            gradientUnits: "userSpaceOnUse",
        });
    } else if (profile === "orb1") {
        mainGrad.attr({
            cx: 238,
            cy: 234,
            r: 319,
            fx: 260,
            fy: 57,
            gradientUnits: "userSpaceOnUse",
        });
    } else {
        mainGrad.attr({
            cx: 250,
            cy: 250,
            r: 260,
            fx: 250,
            fy: 0,
            gradientUnits: "userSpaceOnUse",
        });
    }
    mainGrad.id("radialGradient-" + hash);

    applyFillToSlot(got, "fill", mainGrad);

    if (profile === "orb1") {
        const specHash = gradientIdSuffix(baseHex, "aprender_orb1-spec");
        const radialGradient2 = got.gradient("radial", (add) => {
            add.stop({ offset: "0%", color: "white" });
            add.stop({ offset: "20%", color: "white" });
            add.stop({ offset: "100%", color: "white", opacity: 0 });
        }).attr({
            cx: "50%",
            cy: "50%",
            r: "50%",
            fx: "50%",
            fy: "50%",
        }).id("radialGradient2-" + specHash);
        const radialGradient3 = got.gradient("radial", (add) => {
            add.stop({ offset: "0%", color: "white" });
            add.stop({ offset: "40%", color: "white" });
            add.stop({ offset: "100%", color: "white", opacity: 0 });
        }).attr({
            cx: "50%",
            cy: "50%",
            r: "50%",
            fx: "50%",
            fy: "50%",
        }).id("radialGradient3-" + specHash);
        got.find("[data-orb-specular='2']").each(function (this: SVGElement) {
            this.fill(radialGradient2);
        });
        got.find("[data-orb-specular='3']").each(function (this: SVGElement) {
            this.fill(radialGradient3);
        });
    }

    if (profile === "orb2" || profile === "orb3") {
        const detailHex = detailOverrideHex ?? orbDetailHighlightColour(baseHex);
        applyFillToSlot(got, "detail", detailHex);
    }
}
