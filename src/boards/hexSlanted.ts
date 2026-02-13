import { BoardBasic } from "../schemas/schema";
import { GridPoints, IPoint, IPolyPolygon, hexSlanted as hexSlantedGrid} from "../grids";
import { RendererBase } from "../renderers/_base";

export const hexSlanted = (ctx: RendererBase): [GridPoints, IPolyPolygon[][]] => {
    if ( (ctx.json === undefined) || (ctx.rootSvg === undefined) ) {
        throw new Error("Object in an invalid state!");
    }

    // Check required properties
    if ( (ctx.json.board === null) || (! ("width" in ctx.json.board)) || (! ("height" in ctx.json.board)) || (ctx.json.board.width === undefined) || (ctx.json.board.height === undefined) ) {
        throw new Error("Both the `width` and `height` properties are required for this board type.");
    }
    const boardTyped = ctx.json.board as BoardBasic;
    const gridWidth: number = boardTyped.width as number;
    const gridHeight: number = boardTyped.height as number;
    const cellsize = ctx.cellsize;

    let baseStroke = 1;
    let baseColour = ctx.options.colourContext.strokes;
    let baseOpacity = 1;
    if ( ("strokeWeight" in boardTyped) && (boardTyped.strokeWeight !== undefined) ) {
        baseStroke = boardTyped.strokeWeight;
    }
    if ( ("strokeColour" in boardTyped) && (boardTyped.strokeColour !== undefined) ) {
        baseColour = ctx.resolveColour(boardTyped.strokeColour) as string;
    }
    if ( ("strokeOpacity" in boardTyped) && (boardTyped.strokeOpacity !== undefined) ) {
        baseOpacity = boardTyped.strokeOpacity;
    }

    // Get a grid of points
    const grid = hexSlantedGrid({gridWidth, gridHeight, cellSize: cellsize});
    const board = ctx.rootSvg.group().id("board");
    const gridlines = board.group().id("hexes");

    // build polys
    const triWidth = 50 / 2;
    const halfhex = triWidth / 2;
    const triHeight = (triWidth * Math.sqrt(3)) / 2;

    const hex = ctx.rootSvg.defs().symbol().id("hex-symbol").viewbox(-3.3493649053890344, 0, 50, 50);
    const pts: IPoint[] = [{x:triHeight,y:0}, {x:triHeight * 2,y:halfhex}, {x:triHeight * 2,y:halfhex + triWidth}, {x:triHeight,y:triWidth * 2}, {x:0,y:halfhex + triWidth}, {x:0,y:halfhex}];

    const polys: IPolyPolygon[][] = [];
    for (const row of grid) {
        const rowPolys: IPolyPolygon[] = [];
        for (const p of row) {
            const dx = p.x - triHeight; const dy = p.y - 25;
            rowPolys.push({
                type: "poly",
                points: pts.map(pt => { return {x: pt.x + dx, y: pt.y + dy}}),
            });
        }
        polys.push(rowPolys);
    }

    ctx.markBoard({svgGroup: gridlines, preGridLines: true, grid, polys});

    // Add board labels
    let labelColour = ctx.options.colourContext.labels;
    if ( ("labelColour" in boardTyped) && (boardTyped.labelColour !== undefined) ) {
        labelColour = ctx.resolveColour(boardTyped.labelColour) as string;
    }
    let labelOpacity = 1;
    if ( ("labelOpacity" in boardTyped) && (boardTyped.labelOpacity !== undefined) ) {
        labelOpacity = boardTyped.labelOpacity;
    }
    if ( (! ctx.json.options) || (! ctx.json.options.includes("hide-labels") ) ) {
        const labels = board.group().id("labels");
        let customLabels: string[]|undefined;
        if ( ("columnLabels" in boardTyped) && (boardTyped.columnLabels !== undefined) ) {
            customLabels = boardTyped.columnLabels;
        }
        let columnLabels = ctx.getLabels(customLabels, gridWidth);
        if ( (ctx.json.options !== undefined) && (ctx.json.options.includes("reverse-numbers")) ) {
            columnLabels.reverse();
        }

        customLabels = undefined
        if ( ("rowLabels" in boardTyped) && (boardTyped.rowLabels !== undefined) ) {
            customLabels = boardTyped.rowLabels;
        }
        let rowLabels = ctx.getRowLabels(customLabels, gridHeight);
        if ( (ctx.json.options !== undefined) && (ctx.json.options.includes("reverse-letters")) ) {
            rowLabels.reverse();
        }

        if (ctx.json.options?.includes("swap-labels")) {
            const scratch = [...columnLabels];
            columnLabels = [...rowLabels];
            columnLabels.reverse();
            rowLabels = [...scratch];
            rowLabels.reverse();
        }

        // Columns (letters)
        for (let col = 0; col < gridWidth; col++) {
            const pointTop = {x: grid[0][col].x, y: grid[0][col].y - cellsize};
            const pointBottom = {x: grid[gridHeight - 1][col].x, y: grid[gridHeight - 1][col].y + cellsize};
            labels.text(columnLabels[col]).fill(labelColour).opacity(labelOpacity).center(pointTop.x, pointTop.y);
            labels.text(columnLabels[col]).fill(labelColour).opacity(labelOpacity).center(pointBottom.x, pointBottom.y);
        }

        // Rows (numbers)
        for (let row = 0; row < gridHeight; row++) {
            const pointL = {x: grid[row][0].x - cellsize, y: grid[row][0].y};
            const pointR = {x: grid[row][gridWidth - 1].x + cellsize, y: grid[row][gridWidth - 1].y};
            labels.text(rowLabels[row]).fill(labelColour).opacity(labelOpacity).center(pointL.x, pointL.y);
            labels.text(rowLabels[row]).fill(labelColour).opacity(labelOpacity).center(pointR.x, pointR.y);
        }
    }

    /*
    Flat-topped hexes:
        half, 0
        (half+width), 0
        (width*2), height
        (half+width), (height*2)
        half, (height*2)
        0, height
    Pointy-topped hexes:
        height, 0
        (height*2), half
        (height*2), (half+width)
        height, (width*2)
        0, (half+width)
        0 half
    */

    // Draw hexes
    let hexFill: string|undefined;
    if ( ("hexFill" in boardTyped) && (boardTyped.hexFill !== undefined) && (boardTyped.hexFill !== null) && (typeof boardTyped.hexFill === "string") && (boardTyped.hexFill.length > 0) ){

        hexFill = boardTyped.hexFill;
    }
    const symbolPoly = hex.polygon(pts.map(pt => `${pt.x},${pt.y}`).join(" "))
                        .fill({color: "white", opacity: 0}).id("hex-symbol-poly")
                        .stroke({color: baseColour, opacity: baseOpacity, width: baseStroke, linecap: "round", linejoin: "round"});
    if (hexFill !== undefined) {
        symbolPoly.fill({color: hexFill, opacity: 1});
    }

    type Blocked = [{row: number;col: number;},...{row: number;col: number;}[]];
    let blocked: Blocked|undefined;
    if ( (boardTyped.blocked !== undefined) && (boardTyped.blocked !== null) && (Array.isArray(boardTyped.blocked)) && (boardTyped.blocked.length > 0) ){
        blocked = [...(boardTyped.blocked as Blocked)];
    }

    for (let iRow = 0; iRow < grid.length; iRow++) {
        const row = grid[iRow];
        for (let iCol = 0; iCol < row.length; iCol++) {
            const p = row[iCol];

            // don't draw "blocked" hexes
            if (blocked !== undefined) {
                const found = blocked.find(e => e.row === iRow && e.col === iCol);
                if (found !== undefined) {
                    continue;
                }
            }
            const c = gridlines.use(hex).size(cellsize, cellsize).center(p.x, p.y); // .move(p.x - (cellsize / 2), p.y - (cellsize / 2)); // .center(p.x, p.y);
            if (ctx.options.boardClick !== undefined) {
                c.click(() => ctx.options.boardClick!(iRow, iCol, ""));
            }
        }
    }

    ctx.markBoard({svgGroup: gridlines, preGridLines: false, grid, polys});

    return [grid, polys];
}
