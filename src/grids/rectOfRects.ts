import { GridPoints, IGeneratorArgs, IPoint} from "../GridGenerator";

export function rectOfRects(args: IGeneratorArgs): GridPoints {
    let cellWidth: number = 50;
    let cellHeight: number = 50;
    if (args.cellSize !== undefined) {
        cellWidth = args.cellSize;
        cellHeight = args.cellSize;
    } else if (args.cellHeight !== undefined) {
        cellHeight = args.cellHeight;
    } else if (args.cellWidth !== undefined) {
        cellWidth = args.cellWidth;
    }

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
            const point: IPoint = {x: (cellWidth * col), y: (cellHeight * row)};
            node.push(point);
        }
        grid.push(node);
    }
    return grid;
}
