import type { Container, Element, Use } from "@svgdotjs/svg.js";
import type { ButtonBarButton } from "../schemas/schema.js";
import { labelDisplayText } from "./renderLabel.js";
import { scale } from "./plotting.js";

/** Default draw scale: fraction of the glyph allowance (padding inside the strip). */
export const BUTTON_BAR_DEFAULT_GLYPH_SCALE = 0.76;

export const buttonBarGlyphDrawScale = (glyphScale?: number): number =>
    glyphScale ?? BUTTON_BAR_DEFAULT_GLYPH_SCALE;

/** Width of the strip reserved at the anchored edge (one button height). */
export const buttonBarGlyphAllowance = (buttonHeight: number): number => buttonHeight;

export const buttonBarScaledLabelWidth = (
    labelViewbox: { w: number; h: number },
    buttonHeight: number,
): number => {
    if (labelViewbox.h <= 0) {
        return labelViewbox.w;
    }
    const factor = buttonHeight / labelViewbox.h;
    return labelViewbox.w * factor;
};

/**
 * Button bar width: text band (`maxLabelWidth * 1.5`) plus a glyph allowance when needed.
 */
export const buttonBarTotalWidth = (
    maxLabelWidth: number,
    buttonHeight: number,
    hasAnyGlyph: boolean,
): number => {
    const textBand = maxLabelWidth * 1.5;
    if (!hasAnyGlyph) {
        return textBand;
    }
    return buttonBarGlyphAllowance(buttonHeight) + textBand;
};

export type ButtonBarGlyphPosition = "prefix" | "suffix";

export const buttonBarGlyphPosition = (
    position?: ButtonBarGlyphPosition,
): ButtonBarGlyphPosition => position ?? "prefix";

/** Centre x for the label in the band left after reserving the glyph strip. */
export const buttonBarLabelCenterX = (
    buttonWidth: number,
    buttonHeight: number,
    glyphPosition: ButtonBarGlyphPosition | undefined,
    hasGlyph: boolean,
): number => {
    if (!hasGlyph) {
        return buttonWidth / 2;
    }
    const allowance = buttonBarGlyphAllowance(buttonHeight);
    const pos = buttonBarGlyphPosition(glyphPosition);
    if (pos === "prefix") {
        const textWidth = buttonWidth - allowance;
        return allowance + textWidth / 2;
    }
    const textWidth = buttonWidth - allowance;
    return textWidth / 2;
};

/** Centre x for a glyph drawn inside its edge allowance strip. */
export const buttonBarGlyphCenterX = (
    glyphPosition: ButtonBarGlyphPosition,
    buttonWidth: number,
    buttonHeight: number,
): number => {
    const allowance = buttonBarGlyphAllowance(buttonHeight);
    const pos = buttonBarGlyphPosition(glyphPosition);
    if (pos === "prefix") {
        return allowance / 2;
    }
    return buttonWidth - allowance / 2;
};

const legendDesignSpan = (piece: Element): number => {
    const el = piece as unknown as { viewbox(): { width: number; height: number }; width(): unknown; height(): unknown };
    const vb = el.viewbox();
    let span = Math.max(vb.width, vb.height);
    if (span <= 0) {
        span = Math.max(Number(el.width()), Number(el.height()));
    }
    if (span <= 0) {
        span = 500;
    }
    return span;
};

/** Scale a legend def to fit inside the glyph allowance, centred at (centerX, centerY). */
export const placeButtonBarGlyph = (opts: {
    svg: Container;
    piece: Element;
    allowance: number;
    centerX: number;
    centerY: number;
    glyphScale?: number;
}): Use => {
    const target = opts.allowance * buttonBarGlyphDrawScale(opts.glyphScale);
    const designSpan = legendDesignSpan(opts.piece);
    const factor = target / designSpan;
    const drawn = designSpan * factor;
    const newx = opts.centerX - drawn / 2;
    const newy = opts.centerY - drawn / 2;
    const use = opts.svg.use(opts.piece).move(newx, newy);
    scale(use, factor, newx, newy);
    return use;
};

export const assertButtonBarButton = (button: ButtonBarButton, buttonIndex: number): void => {
    const hasLabel = button.label !== undefined;
    const hasGlyph = button.glyph !== undefined;
    if (!hasLabel && !hasGlyph) {
        throw new Error(
            `buttonBar buttons[${buttonIndex}]: at least one of \`label\` or \`glyph\` is required.`,
        );
    }
    if (!hasLabel && button.attributes !== undefined && button.attributes.length > 0) {
        throw new Error(`buttonBar buttons[${buttonIndex}]: \`attributes\` require a \`label\`.`);
    }
};

/** Click payload suffix after `_btn_` when `value` is omitted. */
export const buttonBarClickValue = (button: ButtonBarButton): string => {
    if (button.value !== undefined) {
        return button.value;
    }
    if (button.label !== undefined) {
        return labelDisplayText(button.label).replace(/\s/g, "");
    }
    return button.glyph!;
};
