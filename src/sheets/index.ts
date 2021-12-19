import { ChessSheet } from "./chess";
import { CoreSheet } from "./core";
import { DiceSheet } from "./dice";
import { ISheet } from "./ISheet";
import { LooneySheet } from "./looney";
import { PiecepackSheet } from "./piecepack";
import { Box } from "@svgdotjs/svg.js";

export { ISheet, CoreSheet, ChessSheet, DiceSheet, LooneySheet, PiecepackSheet };

const sheets = new Map<string, ISheet>();
// Manually add each sheet to the following array
[CoreSheet, ChessSheet, DiceSheet, LooneySheet, PiecepackSheet].forEach((sheet) => {
    if (sheets.has(sheet.name)) {
        throw new Error("The sheet name '" + sheet.name + "' has already been used. Duplicates are not allowed.");
    }
    sheets.set(sheet.name, sheet);
});
export { sheets };

/**
 * A helper function I use when importing arbitrary paths into a glyph.
 *
 * @param box - The bounding box of the glyph.
 * @param minSize - The minimum size of the final viewbox, in those cases where you want the glyph to be smaller.
 * @param alignment - This determines what to do when the glyph is not as large as the viewbox.
 * @param buffer - Adds a guaranteed buffer around the glyph.
 * @returns The `x`, `y`, `width`, and `height` of the resulting viewbox.
 */
export const calcViewBox = (box: Box, minSize?: number, alignment: "N"|"E"|"S"|"W"|"C" = "C", buffer?: number): [number, number, number, number] => {
    const lst = [box.width, box.height];
    if (minSize !== undefined) {
        lst.push(minSize);
    }
    let maxSize = Math.max(...lst);
    let x = box.x;
    let y = box.y;

    if (box.width < maxSize) {
        const delta = maxSize - box.width;
        if (alignment === "E") {
            x -= delta;
        } else if (alignment !== "W") {
            x -= delta / 2;
        }
    }
    if (box.height < maxSize) {
        const delta = maxSize - box.height;
        if (alignment === "S") {
            y -= delta;
        } else if (alignment !== "N") {
            y -= delta / 2;
        }
    }

    if (buffer !== undefined) {
        x -= buffer;
        y -= buffer;
        maxSize += buffer * 2;
    }

    return [x, y, maxSize, maxSize];
}
