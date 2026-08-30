import { ChessSheet } from "./chess.js";
import { CoreSheet } from "./core.js";
import { DiceSheet } from "./dice.js";
import type { ISheet } from "./ISheet.js";
import { LooneySheet } from "./looney.js";
import { PiecepackSheet } from "./piecepack.js";
import { StreetcarSheet } from "./streetcar.js";
import { NatoSheet } from "./nato.js";
import { DecktetSheet } from "./decktet.js";
import { ArimaaSheet } from "./arimaa.js";
import { GnosticaSheet } from "./gnostica.js";
import { ExperimentalSheet } from "./experimental.js";
import { DominoSheet } from "./dominoes.js";
import { Box } from "@svgdotjs/svg.js";

export { CoreSheet, ChessSheet, DiceSheet, LooneySheet, PiecepackSheet, StreetcarSheet, NatoSheet, DecktetSheet, ArimaaSheet, GnosticaSheet, ExperimentalSheet, DominoSheet };
export type { ISheet };

const sheets = new Map<string, ISheet>();
// Manually add each sheet to the following array
[CoreSheet, ChessSheet, DiceSheet, DominoSheet, LooneySheet, PiecepackSheet, StreetcarSheet, NatoSheet, DecktetSheet, ArimaaSheet, GnosticaSheet, ExperimentalSheet].forEach((sheet) => {
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
