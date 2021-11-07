import { ChessSheet } from "./chess";
import { CoreSheet } from "./core";
import { DiceSheet } from "./dice";
import { ISheet } from "./ISheet";
import { LooneySheet } from "./looney";
import { PiecepackSheet } from "./piecepack";

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
