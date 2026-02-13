import { GridPoints, IPoint, rectOfRects } from "../grids";
import { RendererBase } from "../renderers/_base";
import { rotatePoint } from "../common/plotting";

export const squaresStacked = (ctx: RendererBase): GridPoints => {
    if ( (ctx.json === undefined) || (ctx.rootSvg === undefined) ) {
        throw new Error("Object in an invalid state!");
    }

    // Check required properties
    if ( (ctx.json.board === null) || (! ("width" in ctx.json.board)) || (! ("height" in ctx.json.board)) || (ctx.json.board.width === undefined) || (ctx.json.board.height === undefined) ) {
        throw new Error("Both the `width` and `height` properties are required for this board type.");
    }
    if ( (! ("style" in ctx.json.board)) || (ctx.json.board.style === undefined) ) {
        throw new Error("This function requires that a board style be defined.");
    }
    const width: number = ctx.json.board.width;
    const height: number = ctx.json.board.height;
    const cellsize = ctx.cellsize;

    let baseStroke = 1;
    let baseColour = ctx.options.colourContext.strokes;
    let baseOpacity = 1;
    if ( ("strokeWeight" in ctx.json.board) && (ctx.json.board.strokeWeight !== undefined) ) {
        baseStroke = ctx.json.board.strokeWeight;
    }
    if ( ("strokeColour" in ctx.json.board) && (ctx.json.board.strokeColour !== undefined) ) {
        baseColour = ctx.resolveColour(ctx.json.board.strokeColour) as string;
    }
    if ( ("strokeOpacity" in ctx.json.board) && (ctx.json.board.strokeOpacity !== undefined) ) {
        baseOpacity = ctx.json.board.strokeOpacity;
    }

    // Get a grid of points
    const grid = rectOfRects({gridHeight: height, gridWidth: width, cellSize: cellsize, tileHeight: 0, tileWidth: 0, tileSpacing: 0});

    const board = ctx.rootSvg.group().id("board");

    // Make an expanded grid for markers, to accommodate edge marking and shading
    // Add one row and one column and shift all points up and to the left by half a cell size
    let gridExpanded = rectOfRects({gridHeight: height + 1, gridWidth: width + 1, cellSize: cellsize});
    gridExpanded = gridExpanded.map((row) => row.map((cell) => ({x: cell.x - (cellsize / 2), y: cell.y - (cellsize / 2)} as IPoint)));

    // define "tiles" earlier so clickable gridlines are viable
    const tiles = board.group().id("tiles");
    const gridlines = board.group().id("gridlines");
    ctx.markBoard({svgGroup: gridlines, preGridLines: true, grid, gridExpanded});

    // Add board labels
    let labelColour = ctx.options.colourContext.labels;
    if ( ("labelColour" in ctx.json.board) && (ctx.json.board.labelColour !== undefined) ) {
        labelColour = ctx.resolveColour(ctx.json.board.labelColour) as string;
    }
    let labelOpacity = 1;
    if ( ("labelOpacity" in ctx.json.board) && (ctx.json.board.labelOpacity !== undefined) ) {
        labelOpacity = ctx.json.board.labelOpacity;
    }
    if ( (! ctx.json.options) || (! ctx.json.options.includes("hide-labels") ) ) {
        let hideHalf = false;
        if (ctx.json.options?.includes("hide-labels-half")) {
            hideHalf = true;
        }
        const labels = board.group().id("labels");
        let customLabels: string[]|undefined;
        if ( ("columnLabels" in ctx.json.board) && (ctx.json.board.columnLabels !== undefined) ) {
            customLabels = ctx.json.board.columnLabels;
        }
        let columnLabels = ctx.getLabels(customLabels, (width * 2) - 1);
        if ( (ctx.json.options !== undefined) && (ctx.json.options.includes("reverse-letters")) ) {
            columnLabels.reverse();
        }

        let rowLabels = ctx.getRowLabels(ctx.json.board.rowLabels, (height * 2) - 1);
        if ( (ctx.json.options !== undefined) && (ctx.json.options.includes("reverse-numbers")) ) {
            rowLabels.reverse();
        }

        if (ctx.json.options?.includes("swap-labels")) {
            const scratch = [...columnLabels];
            columnLabels = [...rowLabels];
            columnLabels.reverse();
            rowLabels = [...scratch];
            rowLabels.reverse();
        }
        const half = cellsize / 2;
        // Columns (letters)
        for (let col = 0; col < (width * 2) - 1; col++) {
            let pointTop: IPoint;
            let pointBottom: IPoint;
            const realcol = Math.floor(col / 2);
            let opacity = labelOpacity;
            if (col % 2 !== 0) {
                opacity *= 0.5;
            }
            if (col % 2 === 0) {
                pointTop = {x: grid[0][realcol].x, y: grid[0][realcol].y - cellsize};
                pointBottom = {x: grid[height - 1][realcol].x, y: grid[height - 1][realcol].y + cellsize};
            } else {
                pointTop = {x: grid[0][realcol].x+half, y: grid[0][realcol].y - cellsize};
                pointBottom = {x: grid[height - 1][realcol].x+half, y: grid[height - 1][realcol].y + cellsize};
            }
            if (! hideHalf) {
                labels.text(columnLabels[col]).fill(labelColour).opacity(opacity).center(pointTop.x, pointTop.y);
            }
            labels.text(columnLabels[col]).fill(labelColour).opacity(opacity).center(pointBottom.x, pointBottom.y);
        }

        // Rows (numbers)
        for (let row = 0; row < (height * 2) - 1; row++) {
            let pointL: IPoint;
            let pointR: IPoint;
            const realrow = Math.floor(row / 2);
            let opacity = labelOpacity;
            if (row % 2 !== 0) {
                opacity *= 0.5;
            }
            if (row % 2 === 0) {
                pointL = {x: grid[realrow][0].x - cellsize, y: grid[realrow][0].y};
                pointR = {x: grid[realrow][width - 1].x + cellsize, y: grid[realrow][width - 1].y};
            } else {
                pointL = {x: grid[realrow][0].x - cellsize, y: grid[realrow][0].y+half};
                pointR = {x: grid[realrow][width - 1].x + cellsize, y: grid[realrow][width - 1].y+half};
            }
            labels.text(rowLabels[row]).fill(labelColour).opacity(opacity).center(pointL.x, pointL.y);
            if (! hideHalf) {
                labels.text(rowLabels[row]).fill(labelColour).opacity(opacity).center(pointR.x, pointR.y);
            }
        }
    }

    // Load circle tile
    const tile = ctx.rootSvg.defs().symbol().id("tile-circle").viewbox(0, 0, cellsize, cellsize);
    tile.circle(cellsize*0.75)
        .center(cellsize/2, cellsize/2)
        .fill({color: ctx.options.colourContext.background, opacity: 0})
        .stroke({width: 1, opacity: baseOpacity * 0.15, color: baseColour});

    // Place them
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const {x, y} = grid[row][col];
            tiles.use(tile).size(cellsize, cellsize).center(x, y);
        }
    }

    // Draw grid lines
    // Horizontal, top of each row, then bottom line after loop
    const idxLeft = 0;
    const idxRight = width - 1;
    for (let row = 0; row < height; row++) {
        if ( (ctx.json.options) && (ctx.json.options.includes("no-border")) ) {
            if ( (row === 0) || (row === height - 1) ) {
                continue;
            }
        }
        if (row === 0) {
            const thisStroke = baseStroke;
            const x1 = grid[row][idxLeft].x - (cellsize / 2);
            const y1 = grid[row][idxLeft].y - (cellsize / 2);
            const x2 = grid[row][idxRight].x + (cellsize / 2);
            const y2 = grid[row][idxRight].y - (cellsize / 2);
            gridlines.line(x1, y1, x2, y2).stroke({width: thisStroke, color: baseColour, opacity: baseOpacity * 0.15, linecap: "round", linejoin: "round"});
        }

        if (row === height - 1) {
            const lastx1 = grid[row][idxLeft].x - (cellsize / 2);
            const lasty1 = grid[row][idxLeft].y + (cellsize / 2);
            const lastx2 = grid[row][idxRight].x + (cellsize / 2);
            const lasty2 = grid[row][idxRight].y + (cellsize / 2);
            gridlines.line(lastx1, lasty1, lastx2, lasty2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity * 0.15, linecap: "round", linejoin: "round"});
        }
    }

    // Vertical, left of each column, then right line after loop
    const idxTop = 0;
    const idxBottom = height - 1;
    for (let col = 0; col < width; col++) {
        if ( (ctx.json.options) && (ctx.json.options.includes("no-border")) ) {
            if ( (col === 0) || (col === width - 1) ) {
                continue;
            }
        }

        if (col === 0) {
            const thisStroke = baseStroke;
            const x1 = grid[idxTop][col].x - (cellsize / 2);
            const y1 = grid[idxTop][col].y - (cellsize / 2);
            const x2 = grid[idxBottom][col].x - (cellsize / 2);
            const y2 = grid[idxBottom][col].y + (cellsize / 2);
            gridlines.line(x1, y1, x2, y2).stroke({width: thisStroke, color: baseColour, opacity: baseOpacity * 0.15, linecap: "round", linejoin: "round"});
        }

        if (col === width - 1) {
            const lastx1 = grid[idxTop][col].x + (cellsize / 2);
            const lasty1 = grid[idxTop][col].y - (cellsize / 2);
            const lastx2 = grid[idxBottom][col].x + (cellsize / 2);
            const lasty2 = grid[idxBottom][col].y + (cellsize / 2);
            gridlines.line(lastx1, lasty1, lastx2, lasty2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity * 0.15, linecap: "round", linejoin: "round"});
        }
    }

    if (ctx.options.boardClick !== undefined) {
        const rotation = ctx.getRotation();
        const centre = ctx.getBoardCentre();
        const originX = grid[0][0].x;
        const originY = grid[0][0].y;
        const clickDeltaX = (ctx.json.board.clickDeltaX ?? 0);
        const clickDeltaY = (ctx.json.board.clickDeltaX ?? 0);
        const root = ctx.rootSvg;
        const realwidth = (width * 2) - 1;
        const realheight = (height * 2) - 1;
        const realsize = cellsize / 2;
        const genericCatcher = ((e: { clientX: number; clientY: number; }) => {
            const point = rotatePoint(root.point(e.clientX, e.clientY), rotation*-1, centre);
            const x = Math.floor((point.x - (originX - (realsize / 2))) / realsize);
            const y = Math.floor((point.y - (originY - (realsize / 2))) / realsize);
            if (x >= 0 - clickDeltaX && x < realwidth + clickDeltaX && y >= 0 - clickDeltaY && y < realheight + clickDeltaY) {
                ctx.options.boardClick!(y, x, "");
            }
        });
        ctx.rootSvg.click(genericCatcher);
    }

    ctx.markBoard({svgGroup: gridlines, preGridLines: false, grid, gridExpanded});

    return grid;
}
