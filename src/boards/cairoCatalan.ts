import { centroid } from "../common/plotting";
import { GridPoints, IPoint, IPolyPolygon, snubsquare } from "../grids";
import { RendererBase } from "../renderers/_base";

export const cairoCatalan = (ctx: RendererBase): [GridPoints, IPolyPolygon[][]] => {
    if ( (ctx.json === undefined) || (ctx.rootSvg === undefined) ) {
        throw new Error("Object in an invalid state!");
    }

    // Check required properties
    if ( (ctx.json.board === null) || (! ("width" in ctx.json.board)) || (! ("height" in ctx.json.board)) || (ctx.json.board.width === undefined) || (ctx.json.board.height === undefined) ) {
        throw new Error("Both the `width` and `height` properties are required for this board type.");
    }
    const width: number = ctx.json.board.width;
    const height: number = ctx.json.board.height;
    if (width < 2 || height < 2) {
        throw new Error(`The 'cairo-catalan' board must be at least two cells wide and two cells high.`);
    }
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

    // Get a grid of snubsquare points that is 2 larger than requested
    const ssGrid = snubsquare({gridWidth: width + 2, gridHeight: height + 2, cellSize: cellsize});

    // build the list of polys
    // there are four different shapes
    const polys: IPolyPolygon[][] = [];
    for (let ssRow = 0; ssRow < height; ssRow++) {
        const polyRow: IPolyPolygon[] = [];
        for (let ssCol = 0; ssCol < width; ssCol++) {
            const pts: IPoint[] = [];
            if (ssRow % 2 === 0) {
                if (ssCol % 2 === 0) {
                    pts.push(centroid([ssGrid[ssRow][ssCol], ssGrid[ssRow][ssCol + 1], ssGrid[ssRow + 1][ssCol], ssGrid[ssRow + 1][ssCol + 1]])!);
                    pts.push(centroid([ssGrid[ssRow][ssCol + 1], ssGrid[ssRow][ssCol + 2], ssGrid[ssRow + 1][ssCol + 1]])!);
                    pts.push(centroid([ssGrid[ssRow][ssCol + 2], ssGrid[ssRow + 1][ssCol + 2], ssGrid[ssRow + 1][ssCol + 1]])!);
                    pts.push(centroid([ssGrid[ssRow + 1][ssCol + 1], ssGrid[ssRow + 1][ssCol + 2], ssGrid[ssRow + 2][ssCol + 2], ssGrid[ssRow + 2][ssCol + 1]])!);
                    pts.push(centroid([ssGrid[ssRow + 1][ssCol + 1], ssGrid[ssRow + 2][ssCol + 1], ssGrid[ssRow + 1][ssCol]])!);
                } else {
                    pts.push(centroid([ssGrid[ssRow][ssCol + 1], ssGrid[ssRow + 1][ssCol + 1], ssGrid[ssRow + 1][ssCol]])!);
                    pts.push(centroid([ssGrid[ssRow][ssCol + 1], ssGrid[ssRow][ssCol + 2], ssGrid[ssRow + 1][ssCol + 2], ssGrid[ssRow + 1][ssCol + 1]])!);
                    pts.push(centroid([ssGrid[ssRow + 1][ssCol + 1], ssGrid[ssRow + 1][ssCol + 2], ssGrid[ssRow + 2][ssCol + 2]])!);
                    pts.push(centroid([ssGrid[ssRow + 1][ssCol + 1], ssGrid[ssRow + 2][ssCol + 2], ssGrid[ssRow + 2][ssCol + 1]])!);
                    pts.push(centroid([ssGrid[ssRow + 1][ssCol], ssGrid[ssRow + 1][ssCol + 1], ssGrid[ssRow + 2][ssCol + 1], ssGrid[ssRow + 2][ssCol]])!);
                }
            } else {
                if (ssCol % 2 === 0) {
                    pts.push(centroid([ssGrid[ssRow][ssCol], ssGrid[ssRow][ssCol + 1], ssGrid[ssRow + 1][ssCol + 1]])!);
                    pts.push(centroid([ssGrid[ssRow][ssCol + 1], ssGrid[ssRow][ssCol + 2], ssGrid[ssRow + 1][ssCol + 2], ssGrid[ssRow + 1][ssCol + 1]])!);
                    pts.push(centroid([ssGrid[ssRow + 1][ssCol + 1], ssGrid[ssRow + 1][ssCol + 2], ssGrid[ssRow + 2][ssCol + 1]])!);
                    pts.push(centroid([ssGrid[ssRow + 1][ssCol], ssGrid[ssRow + 1][ssCol + 1], ssGrid[ssRow + 2][ssCol + 1], ssGrid[ssRow + 2][ssCol]])!);
                    pts.push(centroid([ssGrid[ssRow][ssCol], ssGrid[ssRow + 1][ssCol + 1], ssGrid[ssRow + 1][ssCol]])!);
                } else {
                    pts.push(centroid([ssGrid[ssRow][ssCol], ssGrid[ssRow][ssCol + 1], ssGrid[ssRow + 1][ssCol + 1], ssGrid[ssRow + 1][ssCol]])!);
                    pts.push(centroid([ssGrid[ssRow][ssCol + 1], ssGrid[ssRow + 1][ssCol + 2], ssGrid[ssRow + 1][ssCol + 1]])!);
                    pts.push(centroid([ssGrid[ssRow + 1][ssCol + 1], ssGrid[ssRow + 1][ssCol + 2], ssGrid[ssRow + 2][ssCol + 2], ssGrid[ssRow + 2][ssCol + 1]])!);
                    pts.push(centroid([ssGrid[ssRow + 1][ssCol + 1], ssGrid[ssRow + 2][ssCol + 1], ssGrid[ssRow + 2][ssCol]])!);
                    pts.push(centroid([ssGrid[ssRow + 1][ssCol], ssGrid[ssRow + 1][ssCol + 1], ssGrid[ssRow + 2][ssCol]])!);
                }
            }
            polyRow.push({
                type: "poly",
                points: pts,
            });
        }
        polys.push(polyRow);
    }

    // build the final grid of points from the centroids of the polys
    const grid: GridPoints = [];
    for (const row of polys) {
        const rowNode: IPoint[] = [];
        for (const poly of row) {
            rowNode.push(centroid(poly.points)!)
        }
        grid.push(rowNode);
    }

    // now render the board
    const board = ctx.rootSvg.group().id("board");
    const gridlines = board.group().id("pentagons");

    ctx.markBoard({svgGroup: gridlines, preGridLines: true, grid, polys});

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
        let columnLabels = ctx.getLabels(undefined, width);
        if ( (ctx.json.options !== undefined) && (ctx.json.options.includes("reverse-letters")) ) {
            columnLabels.reverse();
        }

        let rowLabels: string[] = [];
        for (let row = 0; row < height; row++) {
            rowLabels.push((height - row).toString());
        }
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
            const pointTop = {x: grid[0][col].x, y: grid[0][col].y - cellsize};
            const pointBottom = {x: grid[height - 1][col].x, y: grid[height - 1][col].y + cellsize};
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

    type Blocked = [{row: number;col: number;},...{row: number;col: number;}[]];
    let blocked: Blocked|undefined;
    if ( ("blocked" in ctx.json.board) && (ctx.json.board.blocked !== undefined) && (ctx.json.board.blocked !== null)  && (Array.isArray(ctx.json.board.blocked)) && (ctx.json.board.blocked.length > 0) ){
        blocked = [...(ctx.json.board.blocked as Blocked)];
    }

    let hexFill: string|undefined;
    if ( ("hexFill" in ctx.json.board) && (ctx.json.board.hexFill !== undefined) && (ctx.json.board.hexFill !== null) && (typeof ctx.json.board.hexFill === "string") && (ctx.json.board.hexFill.length > 0) ){
        hexFill = ctx.json.board.hexFill;
    }

    for (let iRow = 0; iRow < height; iRow++) {
        for (let iCol = 0; iCol < width; iCol++) {
            if (blocked !== undefined) {
                if (blocked.find(p => p.row === iRow && p.col === iCol) !== undefined) {
                    continue;
                }
            }
            const c = gridlines.polygon(polys[iRow][iCol].points.map(pt => `${pt.x},${pt.y}`).join(" "))
                                .fill({color: "white", opacity: 0}).id("pentagon-symbol-poly-OO")
                                .stroke({color: baseColour, opacity: baseOpacity, width: baseStroke, linecap: "round", linejoin: "round"});;
            if (hexFill !== undefined) {
                c.fill({color: hexFill, opacity: 1});
            }
            if (ctx.options.boardClick !== undefined) {
                c.click(() => ctx.options.boardClick!(iRow, iCol, ""));
            }
        }
    }

    ctx.markBoard({svgGroup: gridlines, preGridLines: false, grid, polys});

    return [grid, polys];
}
