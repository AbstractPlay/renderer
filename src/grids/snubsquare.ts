import { GridPoints, IGeneratorArgs, IPoint, normalizeX} from "./_base";

/**
 * Generates a rectangular snubsquare field.
 *
 * @export
 * @param {IGeneratorArgs} args
 * @returns {GridPoints}
 */
export function snubsquare(args: IGeneratorArgs): GridPoints {
    let cellSize: number = 50;
    if (args.cellSize !== undefined) {
        cellSize = args.cellSize;
    }
    const triHeight = (cellSize * Math.sqrt(3)) / 2;
    const halfCell = cellSize / 2;

    let gridHeight: number = 6;
    let gridWidth: number = 6;
    if (args.gridHeight !== undefined) {
        gridHeight = args.gridHeight;
    }
    if (args.gridWidth !== undefined) {
        gridWidth = args.gridWidth;
    }

    const grid: GridPoints = [];
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

    // Shift entire grid so it fits in positive space
    return normalizeX(grid);
}
