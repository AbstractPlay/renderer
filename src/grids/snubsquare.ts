import { rad2deg, rotatePoint } from "../common/plotting";
import { GridPoints, IGeneratorArgs, IPoint, normalizeX, SnubStart} from "./_base";

/**
 * Generates a rectangular snubsquare field.
 *
 * @param args - Generator options
 * @returns Map of x,y coordinates to row/column locations
 */
export const snubsquare = (args: IGeneratorArgs): GridPoints => {
    let cellSize = 50;
    if (args.cellSize !== undefined) {
        cellSize = args.cellSize;
    }
    const triHeight = (cellSize * Math.sqrt(3)) / 2;
    const halfCell = cellSize / 2;

    let gridHeight = 6;
    let gridWidth = 6;
    if (args.gridHeight !== undefined) {
        gridHeight = args.gridHeight;
    }
    if (args.gridWidth !== undefined) {
        gridWidth = args.gridWidth;
    }

    let start: SnubStart = "S";
    if (args.snubStart !== undefined) {
        start = args.snubStart;
    }
    if (start === "T") {
        gridWidth++;
    }

    let grid: GridPoints = [];
    for (let row = 0; row < gridHeight; row++) {
        const node: IPoint[] = [];
        for (let col = 0; col < gridWidth; col++) {
            // Generate point
            let point: IPoint;
            // far-left column
            if (col === 0) {
                // top row
                if (row === 0) {
                    point = {x: 0, y: 0};
                // odd row
                } else if ( (row % 2) !== 0) {
                    const last: IPoint = grid[row - 1][0];
                    point = {x: last.x, y: last.y + cellSize};
                // even row
                } else {
                    const last: IPoint = grid[row - 1][0];
                    point = {x: last.x - halfCell, y: last.y + triHeight};
                }
            // odd column
            } else if ( (col % 2) !== 0) {
                const last: IPoint = node[node.length - 1];
                point = {x: last.x + cellSize, y: last.y};
            // even column
            } else {
                const last: IPoint = node[node.length - 1];
                point = {x: last.x + triHeight, y: last.y + halfCell};
            }
            node.push(point);
        }
        grid.push(node);
    }

    // if triangle start, delete the first column of points
    if (start === "T") {
        grid = grid.map(row => row.slice(1));
    }

    // rotate points so top-left and top-right corners share a y coordinate
    const rise = Math.abs(grid[0][0].y - grid[0][grid[0].length - 1].y);
    const run = Math.abs(grid[0][0].x - grid[0][grid[0].length - 1].x);
    const oa = rise/run;
    const deg = rad2deg(Math.atan(oa));
    const rotated = grid.map(row => row.map(pt => rotatePoint(pt, deg*-1, grid[0][0])))

    // Shift entire grid so it fits in positive space
    return normalizeX(rotated);
}
