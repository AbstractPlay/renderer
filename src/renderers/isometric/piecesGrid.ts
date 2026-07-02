import { GridPoints } from "../../grids/_base";
import { IsoPiecesGrid, IsoStackEntry } from "./stack";

export const piecesRowWidth = (
    rowIndex: number,
    gridPoints: GridPoints,
    boardWidth: number | undefined,
): number => {
    if (rowIndex < gridPoints.length) {
        return gridPoints[rowIndex].length;
    }
    if (boardWidth !== undefined) {
        return boardWidth;
    }
    throw new Error(`Cannot determine the width of pieces row ${rowIndex} for this board style.`);
};

export const parseIsoPiecesString = (
    pieces: string,
    gridPoints: GridPoints,
    boardWidth: number | undefined,
): IsoPiecesGrid => {
    if (pieces.indexOf(",") < 0) {
        throw new Error("This renderer requires that you use the comma-delimited or array format of the `pieces` property.");
    }

    const result: IsoPiecesGrid = [];
    const pieceRows = pieces.split("\n");
    for (let iRow = 0; iRow < pieceRows.length; iRow++) {
        const row = pieceRows[iRow];
        let node: IsoStackEntry[][] = [];
        if (row === "_") {
            const rowWidth = piecesRowWidth(iRow, gridPoints, boardWidth);
            node = Array.from({ length: rowWidth }, () => [] as IsoStackEntry[]);
        } else {
            const cells = row.split(",");
            for (const cell of cells) {
                if (cell === "") {
                    node.push([]);
                } else {
                    node.push([...cell]);
                }
            }
        }
        result.push(node);
    }
    return result;
};
