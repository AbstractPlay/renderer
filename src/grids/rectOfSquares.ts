import { GridPoints, IGeneratorArgs, IPoint} from "../GridGenerator";

export function rectOfSquares(args: IGeneratorArgs): GridPoints {
    let cellSize: number = 50;
    if (args.cellSize !== undefined) {
        cellSize = args.cellSize;
    } else if (args.cellHeight !== undefined) {
        cellSize = args.cellHeight;
    } else if (args.cellWidth !== undefined) {
        cellSize = args.cellWidth;
    }
    const halfCell = cellSize / 2;

    let gridHeight: number = 8;
    let gridWidth: number = 8;
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
            const point: IPoint = {x: halfCell + (cellSize * col), y: halfCell + (cellSize * row)};
            node.push(point);
        }
        grid.push(node);
    }
    return grid;
}
