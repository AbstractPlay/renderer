import { deg2rad, toggleFacing } from "../common/plotting";
import { GridPoints, IGeneratorArgs, IPoint} from "./_base";

export interface IMancalaRoundArgs extends IGeneratorArgs {
    // the angle in degrees at which to start (table facing)
    // defaults to 0 (north or straight up)
    start?: number;
}

/**
 * Generates a square field of points separated by a fixed width and height.
 * It's the renderers that choose to interpret these points as centre points or vertices.
 *
 * @param args - Generator options
 * @returns Map of x,y coordinates to row/column locations
 */
export const mancalaRound = (args: IMancalaRoundArgs): GridPoints => {
    let cellWidth = 50;
    if (args.cellSize !== undefined) {
        cellWidth = args.cellSize;
    } else if (args.cellWidth !== undefined) {
        cellWidth = args.cellWidth;
    }
    let cellHeight = 50;
    if (args.cellWidth !== undefined) {
        cellHeight = args.cellWidth;
    }

    let gridWidth = 8;
    if (args.gridWidth !== undefined) {
        gridWidth = args.gridWidth;
    }
    let gridHeight = 1;
    if (args.gridHeight !== undefined) {
        gridHeight = args.gridHeight;
    }

    let startAngle = 0;
    if (args.start !== undefined) {
        startAngle = args.start;
    }
    startAngle = deg2rad(toggleFacing(startAngle));

    let cx = 0;
    let cy = 0;
    if (args.startx !== undefined) {
        cx = args.startx;
    }
    if (args.starty !== undefined) {
        cy = args.starty;
    }

    if (gridWidth < 3) {
        throw new Error("Polygon must have at least 3 gridWidth.");
    }
    if (gridHeight < 1) {
        throw new Error("You must request at least 1 layer.");
    }

    // Compute circumradius required to achieve the minimum side length
    const baseRadius = cellWidth / (2 * Math.sin(Math.PI / gridWidth));

    const grid: GridPoints = [];
    const angleStep = (2 * Math.PI) / gridWidth;

    for (let layer = 0; layer < gridHeight; layer++) {
        const radius = baseRadius + layer * cellHeight;

        const vertices: IPoint[] = [];
        for (let i = 0; i < gridWidth; i++) {
            const angle = startAngle - (i * angleStep);
            vertices.push({
                x: cx + radius * Math.cos(angle),
                y: cy - radius * Math.sin(angle),
            });
        }
        grid.push(vertices);
    }

    // console.log(grid);
    return grid;
}
