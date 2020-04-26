import { ISheet } from "../ISheet";
import { ChessSheet } from "./chess";
import { CoreSheet } from "./core";
import { PiecepackSheet } from "./piecepack";

export { ISheet, CoreSheet, ChessSheet, PiecepackSheet };

const sheets = new Map<string, ISheet>();
// Manually add each sheet to the following array
[CoreSheet, ChessSheet, PiecepackSheet].forEach((sheet) => {
    if (sheets.has(sheet.name)) {
        throw new Error("The sheet name '" + sheet.name + "' has already been used. Duplicates are not allowed.");
    }
    sheets.set(sheet.name, sheet);
});
export { sheets };
