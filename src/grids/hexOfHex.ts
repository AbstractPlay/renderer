import { GridPoints, IGeneratorArgs, IPoint, normalizeX} from "./_base";

/**
 * Generates a hexagonal field of center points that will accommodate hexagons.
 *
 * @export
 * @param {IGeneratorArgs} args
 * @returns {GridPoints}
 */
export function hexOfHex(args: IGeneratorArgs): GridPoints {
    let cellSize: number = 50;
    if (args.cellSize !== undefined) {
        cellSize = args.cellSize;
    }
    const actualHeight = cellSize * 0.75;
    cellSize = (cellSize * Math.sqrt(3)) / 2;
    const halfCell = cellSize / 2;

    let minWidth: number = 4;
    let maxWidth: number = 7;
    if (args.gridWidthMin !== undefined) {
        minWidth = args.gridWidthMin;
    }
    if (args.gridWidthMax !== undefined) {
        maxWidth = args.gridWidthMax;
    }
    if (minWidth >= maxWidth) {
        throw new Error("The maximum width must be greater than the minimum width.");
    }

    const grid: GridPoints = [];
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

    // Shift entire grid so it fits in positive space
    return normalizeX(grid);
}
