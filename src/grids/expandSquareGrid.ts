import { GridPoints, IPoint } from "./_base.js";
import { rectOfRects } from "./rectOfRects.js";

/**
 * Corner grid for square-board markers (lines, shading, labels, edges).
 * Indices are logical row/col corners (0 … width/height); when tileSpacing is set,
 * cumulative gap offsets are applied so tile-boundary coordinates stay aligned
 * with the spaced cell grid used for tiles and flood fills.
 */
export function expandSquareGrid(
    height: number,
    width: number,
    cellSize: number,
    tileWidth: number,
    tileHeight: number,
    tileSpacing: number,
): GridPoints {
    let grid = rectOfRects({ gridHeight: height + 1, gridWidth: width + 1, cellSize });
    if (tileSpacing > 0 && tileWidth > 0 && tileHeight > 0) {
        const hGap = tileSpacing * cellSize;
        const vGap = tileSpacing * cellSize;
        grid = grid.map((row, r) => row.map((cell, c) => ({
            x: cell.x + (c > 0 ? Math.floor((c - 1) / tileWidth) * hGap : 0),
            y: cell.y + (r > 0 ? Math.floor((r - 1) / tileHeight) * vGap : 0),
        })));
    }
    const half = cellSize / 2;
    return grid.map((row) => row.map((cell) => ({
        x: cell.x - half,
        y: cell.y - half,
    } as IPoint)));
}
