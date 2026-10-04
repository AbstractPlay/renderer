import type { ISheet } from "../ISheet.js";
import { ArimaaSheet } from "./arimaa.js";
import { ChessSheet } from "./chess.js";
import { CoreSheet } from "./core.js";
import { DecktetSheet } from "./decktet.js";
import { DiceSheet } from "./dice.js";
import { DominoSheet } from "./dominoes.js";
import { ExperimentalSheet } from "./experimental.js";
import { GnosticaSheet } from "./gnostica.js";
import { LooneySheet } from "./looney.js";
import { NatoSheet } from "./nato.js";
import { PiecepackSheet } from "./piecepack.js";
import { StreetcarSheet } from "./streetcar.js";

export {
    ArimaaSheet,
    ChessSheet,
    CoreSheet,
    DecktetSheet,
    DiceSheet,
    DominoSheet,
    ExperimentalSheet,
    GnosticaSheet,
    LooneySheet,
    NatoSheet,
    PiecepackSheet,
    StreetcarSheet,
};

/** Sheet modules in registration order (must stay unique by `name`). */
export const contactSheets: ISheet[] = [
    CoreSheet,
    ChessSheet,
    DiceSheet,
    DominoSheet,
    LooneySheet,
    PiecepackSheet,
    StreetcarSheet,
    NatoSheet,
    DecktetSheet,
    ArimaaSheet,
    GnosticaSheet,
    ExperimentalSheet,
];
