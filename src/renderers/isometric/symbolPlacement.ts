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
    const widthRatio = parseFloat(symbol.attr("data-width-ratio") as string);
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
