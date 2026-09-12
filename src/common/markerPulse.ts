import { Circle as SVGCircle, Polygon as SVGPolygon, Path as SVGPath, Svg, TimeLike } from "@svgdotjs/svg.js";

export const PULSE_KEYFRAMES_STYLE_ID = "aprender-pulse-keyframes";
const PULSE_ANIMATION_NAME = "aprender-marker-pulse";

export type PulseElement = SVGCircle | SVGPolygon | SVGPath;

const ensureStaticPulseStyles = (rootSvg: Svg): void => {
    if (rootSvg.findOne(`#${PULSE_KEYFRAMES_STYLE_ID}`) !== null) {
        return;
    }
    const css = `@keyframes ${PULSE_ANIMATION_NAME} { 0%, 100% { fill-opacity: 0; } 50% { fill-opacity: 1; } }`;
    rootSvg.defs().element("style").id(PULSE_KEYFRAMES_STYLE_ID).words(css);
};

/**
 * Attach flood-marker pulse animation. Live renders use SVG.js; static output uses CSS keyframes.
 */
export const attachMarkerPulse = (
    element: PulseElement,
    durationMs: number,
    mode: { static: boolean; rootSvg?: Svg },
): void => {
    if (mode.static) {
        if (mode.rootSvg === undefined) {
            throw new Error("rootSvg is required for static marker pulse.");
        }
        ensureStaticPulseStyles(mode.rootSvg);
        const animation = `animation: ${PULSE_ANIMATION_NAME} ${durationMs}ms ease-in-out infinite`;
        const existingStyle = element.attr("style");
        element.attr(
            "style",
            existingStyle !== undefined && existingStyle !== ""
                ? `${existingStyle}; ${animation}`
                : animation,
        );
        return;
    }

    element
        .animate({ duration: durationMs, delay: 0, when: "now", swing: true } as TimeLike)
        .during((t: number) => element.fill({ opacity: t }))
        .loop(undefined, true);
};
