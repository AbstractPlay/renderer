import { GridPoints, IGeneratorArgs, IPoint, normalizeX} from "./_base";

/**
 * Generates a hexagonal field of center points that will accommodate hexagons.
 *
 * @param args - Generator options
 * @returns Map of x,y coordinates to row/column locations
 */
export const hexSlanted = (args: IGeneratorArgs): GridPoints => {
    let cellSize = 50;
    if (args.cellSize !== undefined) {
        cellSize = args.cellSize;
    }
    let gridWidth = 8;
    if (args.gridWidth !== undefined) {
        gridWidth = args.gridWidth;
    }
    let gridHeight = 8;
    if (args.gridHeight !== undefined) {
        gridHeight = args.gridHeight;
    }
    const actualHeight = cellSize * 0.75;
    cellSize = (cellSize * Math.sqrt(3)) / 2;
    const halfCell = cellSize / 2;

    const grid: GridPoints = [];
    // Generate the top half, including the middle row
    for (let row = 0; row < gridHeight; row++) {
        const startX: number = halfCell * row;
        const node: IPoint[] = [];
        for (let col = 0; col < gridWidth; col++) {
            const p: IPoint = {x: startX + (cellSize * col), y: actualHeight * row};
            node.push(p);
        }
        grid.push(node);
    }

    // Shift entire grid so it fits in positive space
    return normalizeX(grid);
}
