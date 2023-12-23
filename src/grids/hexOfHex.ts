import { GridPoints, IGeneratorArgs, IPoint, normalizeX} from "./_base";

/**
 * Generates a hexagonal field of center points that will accommodate hexagons.
 *
 * @param args - Generator options
 * @returns Map of x,y coordinates to row/column locations
 */
export const hexOfHex = (args: IGeneratorArgs): GridPoints => {
    let cellSize = 50;
    if (args.cellSize !== undefined) {
        cellSize = args.cellSize;
    }
    const actualHeight = cellSize * 0.75;
    cellSize = (cellSize * Math.sqrt(3)) / 2;
    const halfCell = cellSize / 2;

    let minWidth = 4;
    let maxWidth = 7;
    if (args.gridWidthMin !== undefined) {
        minWidth = args.gridWidthMin;
    }
    if (args.gridWidthMax !== undefined) {
        maxWidth = args.gridWidthMax;
    }
    if (minWidth >= maxWidth) {
        throw new Error("The maximum width must be greater than the minimum width.");
    }

    let grid: GridPoints = [];
    // Generate the top half, including the middle row
    for (let row = 0; row < maxWidth - minWidth + 1; row ++) {
        const startX: number = (halfCell * -1) * row;
        const node: IPoint[] = [];
        for (let col = 0; col < minWidth + row; col ++) {
            const p: IPoint = {x: startX + (cellSize * col), y: actualHeight * row};
            node.push(p);
        }
        grid.push(node);
    }
    // Now mirror the rows before the middle to the bottom half
    for (let row = maxWidth - minWidth - 1; row >= 0; row--) {
        const node: IPoint[] = [];
        const curr = grid[row];
        const dist = (maxWidth - minWidth - row) * 2;
        curr.forEach((p) => {
            const newp = {x: p.x, y: p.y + (actualHeight * dist)};
            node.push(newp);
        });
        grid.push(node);
    }

    // if `half` is specified, drop rows
    if (args.half === "top") {
        const lastrow = maxWidth - minWidth;
        grid = grid.slice(0, lastrow + 1);
    } else if (args.half === "bottom") {
        const firstrow = maxWidth - minWidth;
        grid = grid.slice(firstrow);
    }

    // Shift entire grid so it fits in positive space
    return normalizeX(grid);
}
