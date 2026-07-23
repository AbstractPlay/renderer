import { Svg } from "@svgdotjs/svg.js";

export type IsoSymbolPlacement = {
    newx: number;
    newy: number;
    newWidth: number;
    newHeight: number;
    anchorY: number;
};

export type IsoSymbolDimensions = {
    width: number;
    height: number;
};

const symbolScaleFactors = (
    cellsize: number,
    symbol: Svg,
    scale: number,
    rowHeight?: number,
): { factor: number; factorHeight: number | undefined; viewboxWidth: number; viewboxHeight: number } => {
    const widthRatioRaw = symbol.attr("data-width-ratio");
    let widthRatio = 1;
    if (widthRatioRaw !== undefined && widthRatioRaw !== null && widthRatioRaw !== "") {
        const parsed = parseFloat(widthRatioRaw as string);
        if (!Number.isNaN(parsed)) {
            widthRatio = parsed;
        }
    }
    let heightRatio: number | undefined;
    if (symbol.attr("data-height-ratio") !== undefined) {
        heightRatio = parseFloat(symbol.attr("data-height-ratio") as string);
    }
    const vb = symbol.viewbox();
    const basis = rowHeight ?? cellsize;
    const factor = basis / vb.width * widthRatio * scale;
    let factorHeight: number | undefined;
    if (heightRatio !== undefined) {
        factorHeight = basis / vb.height * heightRatio * scale;
    }
    return { factor, factorHeight, viewboxWidth: vb.width, viewboxHeight: vb.height };
};

export const isoSymbolDimensions = (
    cellsize: number,
    symbol: Svg,
    scale: number,
    rowHeight?: number,
): IsoSymbolDimensions => {
    const { factor, factorHeight, viewboxWidth, viewboxHeight } = symbolScaleFactors(cellsize, symbol, scale, rowHeight);
    const width = factor * viewboxWidth;
    let height = factor * viewboxHeight;
    if (factorHeight !== undefined) {
        height = factorHeight * viewboxHeight;
    }
    const fitBasis = rowHeight ?? cellsize;
    const fit = Math.min(1, fitBasis / width, fitBasis / height);
    return { width: width * fit, height: height * fit };
};

/** Square draw side for a sheet glyph: uniform viewBox fit to budget (long side fills the square use). */
export const glyphViewBoxSquareDrawSize = (budget: number, symbol: Svg): number => {
    const vb = symbol.viewbox();
    if (vb.width <= 0 || vb.height <= 0) {
        return budget;
    }
    const scale = Math.min(budget / vb.width, budget / vb.height);
    const fittedW = vb.width * scale;
    const fittedH = vb.height * scale;
    return Math.max(fittedW, fittedH);
};

/** @deprecated Use glyphViewBoxSquareDrawSize for sheet glyphs on iso faces. */
export const isoFittedSquareSize = (basis: number, symbol: Svg, scale = 1): number => {
    const { width, height } = isoSymbolDimensions(basis, symbol, scale);
    return Math.min(width, height);
};

/** Place a symbol so its stacking anchor sits on (anchorX, anchorY). */
export const isoSymbolPlacement = (
    cellsize: number,
    anchorX: number,
    anchorY: number,
    symbol: Svg,
    scale: number,
): IsoSymbolPlacement => {
    const { factor, factorHeight, viewboxWidth, viewboxHeight } = symbolScaleFactors(cellsize, symbol, scale);
    const newWidth = factor * viewboxWidth;
    let newHeight = factor * viewboxHeight;
    if (factorHeight !== undefined) {
        newHeight = factorHeight * viewboxHeight;
    }
    const dyBottom = parseFloat(symbol.attr("data-dy-bottom") as string) * newHeight;
    const newx = anchorX - (newWidth / 2);
    const newy = anchorY - dyBottom;
    const dyTop = parseFloat(symbol.attr("data-dy-top") as string) * newHeight;
    return { newx, newy, newWidth, newHeight, anchorY: newy + dyTop };
};
