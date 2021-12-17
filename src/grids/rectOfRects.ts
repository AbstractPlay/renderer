import { GridPoints, IGeneratorArgs, IPoint} from "./_base";

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

    let startx: number = 0;
    let starty: number = 0;
    if (args.startx !== undefined) {
        startx = args.startx;
    }
    if (args.starty !== undefined) {
        starty = args.starty;
    }

    let tilex = 0;
    let tiley = 0;
    let tilespace = 0;
    let hspace = 0;
    let vspace = 0;
    if (args.tileWidth !== undefined) {
        tilex = args.tileWidth;
        if ( (tilex > 0) && (gridWidth % tilex !== 0) ) {
            throw new Error("When tiling, the total board width must divide evenly by the tile width.");
        }
    }
    if (args.tileHeight !== undefined) {
        tiley = args.tileHeight;
        if ( (tiley > 0) && (gridHeight % tiley !== 0) ) {
            throw new Error("When tiling, the total board height must divide evenly by the tile height.");
        }
    }
    if (args.tileSpacing !== undefined) {
        tilespace = args.tileSpacing;
        hspace = tilespace * cellWidth;
        vspace = tilespace * cellHeight;
    }

    const grid: GridPoints = [];
    let dy = 0;
    for (let row = 0; row < gridHeight; row++) {
        const node: IPoint[] = [];
        if ( (tiley > 0) && (tilespace > 0) && (row > 0) && (row % tiley === 0) ) {
            dy += vspace;
        }
        let dx = 0;
        for (let col = 0; col < gridWidth; col++) {
            if ( (tilex > 0) && (tilespace > 0) && (col > 0) && (col % tilex === 0) ) {
                dx += hspace;
            }
            const point: IPoint = {x: startx + (cellWidth * col) + dx, y: starty + (cellHeight * row) + dy};
            node.push(point);
        }
        grid.push(node);
    }
    return grid;
}
