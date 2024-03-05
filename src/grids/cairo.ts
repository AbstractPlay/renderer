import { GridPoints, IGeneratorArgs, IPoint, PentagonOrientation} from "./_base";

/**
 * Generates a square field of points separated by a fixed width and height.
 * It's the renderers that choose to interpret these points as centre points or vertices.
 *
 * @param args - Generator options
 * @returns Map of x,y coordinates to row/column locations
 */
export const cairo = (args: IGeneratorArgs): GridPoints => {
    let cellWidth = 50;
    let cellHeight = 50;
    if (args.cellSize !== undefined) {
        cellWidth = args.cellSize;
        cellHeight = args.cellSize;
    } else if (args.cellHeight !== undefined) {
        cellHeight = args.cellHeight;
    } else if (args.cellWidth !== undefined) {
        cellWidth = args.cellWidth;
    }

    let gridHeight = 6;
    let gridWidth = 6;
    if (args.gridHeight !== undefined) {
        gridHeight = args.gridHeight;
    }
    if (args.gridWidth !== undefined) {
        gridWidth = args.gridWidth;
    }

    let startx = 0;
    let starty = 0;
    if (args.startx !== undefined) {
        startx = args.startx;
    }
    if (args.starty !== undefined) {
        starty = args.starty;
    }

    let startOrientation: PentagonOrientation = "H";
    if (args.cairoStart !== undefined) {
        startOrientation = args.cairoStart;
    }

    const grid: GridPoints = [];
    let rowStartOrientation: PentagonOrientation;
    let rowStartX: number; let rowStartY: number;
    for (let row = 0; row < gridHeight; row++) {
        const node: IPoint[] = [];
        if (row % 2 === 0) {
            rowStartOrientation = startOrientation;
        } else if (startOrientation === "H") {
            rowStartOrientation = "V";
        } else {
            rowStartOrientation = "H";
        }
        if (rowStartOrientation === startOrientation) {
            rowStartX = startx;
            rowStartY = starty + (cellHeight * (3 * (row / 2)));
        } else {
            if (rowStartOrientation === "H") {
                rowStartX = startx - (cellWidth / 2);
                rowStartY = starty + (cellHeight * (2 + (Math.floor(row / 2) * 3)) );
            } else {
                rowStartX = startx + (cellWidth / 2);
                rowStartY = starty + (cellHeight * (1 + (Math.floor(row / 2) * 3)) );
            }
        }
        for (let col = 0; col < gridWidth; col++) {
            let orientation = rowStartOrientation;
            if (col % 2 !== 0) {
                if (rowStartOrientation === "H") {
                    orientation = "V";
                } else {
                    orientation = "H";
                }
            }
            let currX = rowStartX;
            let currY = rowStartY;
            if (orientation === rowStartOrientation) {
                currX += cellWidth * (3 * (col / 2));
            } else {
                if (orientation === "H") {
                    currX += cellWidth * (1 + (Math.floor(col / 2) * 3));
                    currY += cellHeight / 2;
                } else {
                    currX += cellWidth * (2 + (Math.floor(col / 2) * 3));
                    currY -= cellHeight / 2;
                }
            }
            node.push({x: currX, y: currY});
            if (orientation === "H") {
                node.push({x: currX + cellWidth, y: currY});
            } else {
                node.push({x: currX, y: currY + cellHeight});
            }
            if (orientation === "H") {
                orientation = "V";
            } else {
                orientation = "H";
            }
        }
        grid.push(node);
    }
    return grid;
}
