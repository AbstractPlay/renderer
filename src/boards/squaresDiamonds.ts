import { centroid } from "../common/plotting";
import { GridPoints, IPolyPolygon, Poly, rectOfRects } from "../grids";
import { RendererBase } from "../renderers/_base";

export const squaresDiamonds = (ctx: RendererBase): [GridPoints, Poly[][]] => {
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
    // height and width here refer to the number of square/octagon cells
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
    let gridStart: "S"|"D" = "S";
    if ("sdStart" in ctx.json.board && ctx.json.board.sdStart !== undefined) {
        gridStart = ctx.json.board.sdStart;
    }

    // Get a grid of points
    const grid = rectOfRects({gridHeight: height, gridWidth: width, cellSize: cellsize});
    const board = ctx.rootSvg.group().id("board");

    // construct all diamonds and octagon polys and then pare them down
    const dr = cellsize * 0.25;
    let polys: IPolyPolygon[][] = [];
    for (let row = 0; row < height; row++) {
        const rowDiamonds: IPolyPolygon[] = [];
        const rowSquares: IPolyPolygon[] = [];
        const rowExtraDiamonds: IPolyPolygon[] = [];
        for (let col = 0; col < width; col++) {
            const {x: cx, y: cy} = grid[row][col];
            // top-left diamond
            const dcx = cx - (cellsize / 2);
            const dcy = cy - (cellsize / 2);
            rowDiamonds.push({
                type: "poly",
                points: [
                    {x: dcx, y: dcy - dr},
                    {x: dcx + dr, y: dcy},
                    {x: dcx, y: dcy + dr},
                    {x: dcx - dr, y: dcy},
                ]
            });
            // if last col, top-right diamond
            if (col === width - 1) {
                const dcx2 = cx + (cellsize / 2);
                const dcy2 = cy - (cellsize / 2);
                rowDiamonds.push({
                    type: "poly",
                    points: [
                        {x: dcx2, y: dcy2 - dr},
                        {x: dcx2 + dr, y: dcy2},
                        {x: dcx2, y: dcy2 + dr},
                        {x: dcx2 - dr, y: dcy2},
                    ]
                });
            }
            // square
            rowSquares.push({
                type: "poly",
                points: [
                    {x: cx - (cellsize / 2) + dr, y: cy - (cellsize / 2)},
                    {x: cx + (cellsize / 2) - dr, y: cy - (cellsize / 2)},
                    {x: cx + (cellsize / 2), y: cy - (cellsize / 2) + dr},
                    {x: cx + (cellsize / 2), y: cy + (cellsize / 2) - dr},
                    {x: cx + (cellsize / 2) - dr, y: cy + (cellsize / 2)},
                    {x: cx - (cellsize / 2) + dr, y: cy + (cellsize / 2)},
                    {x: cx - (cellsize / 2), y: cy + (cellsize / 2) - dr},
                    {x: cx - (cellsize / 2), y: cy - (cellsize / 2) + dr},
                ]
            });
            // if last row, bottom-left diamond
            if (row === height - 1) {
                const dcxb = cx - (cellsize / 2);
                const dcyb = cy + (cellsize / 2);
                rowExtraDiamonds.push({
                    type: "poly",
                    points: [
                        {x: dcxb, y: dcyb - dr},
                        {x: dcxb + dr, y: dcyb},
                        {x: dcxb, y: dcyb + dr},
                        {x: dcxb - dr, y: dcyb},
                    ]
                });
                // if last row and col, bottom-right diamond
                if (col === width - 1) {
                    const dcx2 = cx + (cellsize / 2);
                    const dcy2 = cy + (cellsize / 2);
                    rowExtraDiamonds.push({
                        type: "poly",
                        points: [
                            {x: dcx2, y: dcy2 - dr},
                            {x: dcx2 + dr, y: dcy2},
                            {x: dcx2, y: dcy2 + dr},
                            {x: dcx2 - dr, y: dcy2},
                        ]
                    });
                }
            }
        }
        polys.push(rowDiamonds);
        polys.push(rowSquares);
        if (rowExtraDiamonds.length > 0) {
            polys.push(rowExtraDiamonds)
        }
    }
    if (gridStart === "S") {
        polys = polys.slice(1, -1).map(row => row.length > width ? row.slice(1, -1) : row);
    }
    const gridPoints: GridPoints = polys.map(row => row.map(poly => centroid(poly.points)!))

    // get list of just squares for placing pieces
    const pcGrid: GridPoints = [];
    for (let row = gridStart === "S" ? 0 : 1; row < gridPoints.length; row += 2) {
        pcGrid.push(gridPoints[row]);
    }

    // have to define tiles early for clickable markers to work
    // const tiles = board.group().id("tiles");
    const gridlines = board.group().id("gridlines");
    ctx.markBoard({svgGroup: gridlines, preGridLines: true, grid: gridPoints, polys});

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
        let columnLabels = ctx.getLabels(customLabels, width);
        if ( (ctx.json.options !== undefined) && (ctx.json.options.includes("reverse-letters")) ) {
            columnLabels.reverse();
        }

        let rowLabels = ctx.getRowLabels(ctx.json.board.rowLabels, height);
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

        // Columns (letters)
        for (let col = 0; col < width; col++) {
            const pointTop = {x: grid[0][col].x, y: grid[0][col].y - (cellsize)};
            const pointBottom = {x: grid[height - 1][col].x, y: grid[height - 1][col].y + (cellsize)};
            if (! hideHalf) {
                labels.text(columnLabels[col]).fill(labelColour).opacity(labelOpacity).center(pointTop.x, pointTop.y);
            }
            labels.text(columnLabels[col]).fill(labelColour).opacity(labelOpacity).center(pointBottom.x, pointBottom.y);
        }

        // Rows (numbers)
        for (let row = 0; row < height; row++) {
            const pointL = {x: grid[row][0].x - cellsize, y: grid[row][0].y};
            const pointR = {x: grid[row][width - 1].x + cellsize, y: grid[row][width - 1].y};
            labels.text(rowLabels[row]).fill(labelColour).opacity(labelOpacity).center(pointL.x, pointL.y);
            if (! hideHalf) {
                labels.text(rowLabels[row]).fill(labelColour).opacity(labelOpacity).center(pointR.x, pointR.y);
            }
        }
    }

    // Draw grid lines
    type Blocked = [{row: number;col: number;},...{row: number;col: number;}[]];
    let blocked: Blocked|undefined;
    if ( (ctx.json.board.blocked !== undefined) && (ctx.json.board.blocked !== null) && (Array.isArray(ctx.json.board.blocked)) && (ctx.json.board.blocked.length > 0) ){
        blocked = [...(ctx.json.board.blocked as Blocked)];
    }
    for (let row = 0; row < polys.length; row++) {
        for (let col = 0; col < polys[row].length; col++) {
            const isBlocked = blocked?.find(entry => entry.row === row && entry.col === col) !== undefined;
            if (isBlocked) { continue; }
            const poly = polys[row][col];
            const cell = gridlines.polygon(poly.points.map(({ x, y }) => `${x},${y}`).join(" "))
                                    .stroke({color: baseColour, width: baseStroke, opacity: baseOpacity})
                                    .fill({color: "white", opacity: 0});
            if (ctx.options.boardClick !== undefined) {
                cell.click(() => ctx.options.boardClick!(row, col, ""));
            }
        }
    }

    ctx.markBoard({svgGroup: gridlines, preGridLines: false, grid: gridPoints, polys});

    return [gridPoints, polys];
}
