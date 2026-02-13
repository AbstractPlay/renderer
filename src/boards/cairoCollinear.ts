import { Symbol as SVGSymbol } from "@svgdotjs/svg.js";
import { cairo, GridPoints, IPoint, IPolyPolygon } from "../grids";
import { RendererBase } from "../renderers/_base";
import { BoardBasic } from "../schemas/schema";

export const cairoCollinear = (ctx: RendererBase): [GridPoints, IPolyPolygon[][]] => {
    if ( (ctx.json === undefined) || (ctx.rootSvg === undefined) ) {
        throw new Error("Object in an invalid state!");
    }

    // Check required properties
    if ( (ctx.json.board === null) || (! ("width" in ctx.json.board)) || (! ("height" in ctx.json.board)) || (ctx.json.board.width === undefined) || (ctx.json.board.height === undefined) ) {
        throw new Error("Both the `width` and `height` properties are required for this board type.");
    }
    const boardTyped = ctx.json.board as BoardBasic;
    // Width and Height are in number of two-cell pairs
    const width: number = boardTyped.width as number;
    const height: number = boardTyped.height as number;
    const cellsize = ctx.cellsize;
    type PentagonOrientation = "H"|"V";
    let startOrientation: PentagonOrientation = "H";
    if ( ("cairoStart" in boardTyped) && (boardTyped.cairoStart !== undefined) ) {
        startOrientation = boardTyped.cairoStart as PentagonOrientation;
    }

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
    const grid = cairo({gridWidth: width, gridHeight: height, cellSize: cellsize, cairoStart: startOrientation});
    const board = ctx.rootSvg.group().id("board");
    const gridlines = board.group().id("pentagons");

    /*
        Pentagon points (N-facing):
        0, -half
        widest, -quarter
        half, half
        -half, half
        -widest, -quarter
    */

    // build polys
    const half = cellsize / 2;
    const quarter = cellsize / 4;
    const widest = half + quarter;

    type Blocked = [{row: number;col: number;},...{row: number;col: number;}[]];
    let blocked: Blocked|undefined;
    if ( ("blocked" in boardTyped) && (boardTyped.blocked !== undefined) && (boardTyped.blocked !== null)  && (Array.isArray(boardTyped.blocked)) && (boardTyped.blocked.length > 0) ){
        blocked = [...(boardTyped.blocked as Blocked)];
    }

    let hexFill: string|undefined;
    if ( ("hexFill" in boardTyped) && (boardTyped.hexFill !== undefined) && (boardTyped.hexFill !== null) && (typeof boardTyped.hexFill === "string") && (boardTyped.hexFill.length > 0) ){
        hexFill = boardTyped.hexFill;
    }
    const pentN = ctx.rootSvg.defs().symbol().id("pentagon-symbol-N").viewbox(0 - widest - 1, 0 - half - 1, (cellsize * 1.5) + 2, cellsize + 2);
    const ptsN: IPoint[] = [{x: 0, y: 0 - half}, {x: widest, y: 0 - quarter}, {x: half, y: half}, {x: 0 - half, y: half}, {x: 0 - widest, y: 0 - quarter}];
    const symbolPolyN = pentN.polygon(ptsN.map(pt => `${pt.x},${pt.y}`).join(" "))
                        .fill({color: "white", opacity: 0}).id("pentagon-symbol-poly-N")
                        .stroke({color: baseColour, opacity: baseOpacity, width: baseStroke, linecap: "round", linejoin: "round"});
    if (hexFill !== undefined) {
        symbolPolyN.fill({color: hexFill, opacity: 1});
    }
    const pentS = ctx.rootSvg.defs().symbol().id("pentagon-symbol-S").viewbox(0 - widest - 1, 0 - half - 1, (cellsize * 1.5) + 2, cellsize + 2);
    const ptsS: IPoint[] = [{x: 0, y: half}, {x: 0 - widest, y: quarter}, {x: 0 - half, y: 0 - half}, {x: half, y: 0 - half}, {x: widest, y: quarter}];
    const symbolPolyS = pentS.polygon(ptsS.map(pt => `${pt.x},${pt.y}`).join(" "))
                        .fill({color: "white", opacity: 0}).id("pentagon-symbol-poly-S")
                        .stroke({color: baseColour, opacity: baseOpacity, width: baseStroke, linecap: "round", linejoin: "round"});
    if (hexFill !== undefined) {
        symbolPolyS.fill({color: hexFill, opacity: 1});
    }
    const pentE = ctx.rootSvg.defs().symbol().id("pentagon-symbol-E").viewbox(0 - half - 1, 0 - widest - 1, cellsize + 2, (cellsize * 1.5) + 2);
    const ptsE: IPoint[] = [{x: half, y: 0}, {x: quarter, y: widest}, {x: 0 - half, y: half}, {x: 0 - half, y: 0 - half}, {x: quarter, y: 0 - widest}];
    const symbolPolyE = pentE.polygon(ptsE.map(pt => `${pt.x},${pt.y}`).join(" "))
                        .fill({color: "white", opacity: 0}).id("pentagon-symbol-poly-E")
                        .stroke({color: baseColour, opacity: baseOpacity, width: baseStroke, linecap: "round", linejoin: "round"});
    if (hexFill !== undefined) {
        symbolPolyE.fill({color: hexFill, opacity: 1});
    }
    const pentW = ctx.rootSvg.defs().symbol().id("pentagon-symbol-W").viewbox(0 - half - 1, 0 - widest - 1, cellsize + 2, (cellsize * 1.5) + 2);
    const ptsW: IPoint[] = [{x: 0 - half, y: 0}, {x: 0 - quarter, y: 0 - widest}, {x: half, y: 0 - half}, {x: half, y: half}, {x: 0 - quarter, y: widest}];
    const symbolPolyW = pentW.polygon(ptsW.map(pt => `${pt.x},${pt.y}`).join(" "))
                        .fill({color: "white", opacity: 0}).id("pentagon-symbol-poly-W")
                        .stroke({color: baseColour, opacity: baseOpacity, width: baseStroke, linecap: "round", linejoin: "round"});
    if (hexFill !== undefined) {
        symbolPolyW.fill({color: hexFill, opacity: 1});
    }

    const polys: IPolyPolygon[][] = [];
    let orientation = startOrientation;
    for (let iRow = 0; iRow < height; iRow++) {
        const row = grid[iRow];
        if (iRow % 2 === 0) {
            orientation = startOrientation;
        } else if (startOrientation === "H") {
            orientation = "V";
        } else {
            orientation = "H";
        }
        const rowPolys: IPolyPolygon[] = [];
        for (let iCol = 0; iCol < width; iCol++) {
            const pairs: {pt: IPoint, w: number, h: number, col: number, sym: SVGSymbol, verts: IPoint[]}[] = [];
            if (orientation === "H") {
                pairs.push({
                    pt: row[iCol * 2],
                    col: iCol * 2,
                    w: cellsize + 2,
                    h: (cellsize * 1.5) + 2,
                    sym: pentW,
                    verts: ptsW,
                });
                pairs.push({
                    pt: row[(iCol * 2) + 1],
                    col: (iCol * 2) + 1,
                    w: cellsize + 2,
                    h: (cellsize * 1.5) + 2,
                    sym: pentE,
                    verts: ptsE,
                });
            } else {
                pairs.push({
                    pt: row[iCol * 2],
                    col: iCol * 2,
                    w: (cellsize * 1.5) + 2,
                    h: cellsize + 2,
                    sym: pentN,
                    verts: ptsN,
                });
                pairs.push({
                    pt: row[(iCol * 2) + 1],
                    col: (iCol * 2) + 1,
                    w: (cellsize * 1.5) + 2,
                    h: cellsize + 2,
                    sym: pentS,
                    verts: ptsS,
                });
            }
            for (const {pt, verts} of pairs) {
                rowPolys.push({
                    type: "poly",
                    points: verts.map(vpt => { return {x: vpt.x + pt.x, y: vpt.y + pt.y}}),
                });
            }
            if (orientation === "H") {
                orientation = "V";
            } else {
                orientation = "H";
            }
        }
        polys.push(rowPolys);
    }

    ctx.markBoard({svgGroup: gridlines, preGridLines: true, grid, polys});

    // now actually draw pentagons
        orientation = startOrientation;
    for (let iRow = 0; iRow < height; iRow++) {
        const row = grid[iRow];
        if (iRow % 2 === 0) {
            orientation = startOrientation;
        } else if (startOrientation === "H") {
            orientation = "V";
        } else {
            orientation = "H";
        }
        for (let iCol = 0; iCol < width; iCol++) {
            const pairs: {pt: IPoint, w: number, h: number, col: number, sym: SVGSymbol, verts: IPoint[]}[] = [];
            if (orientation === "H") {
                pairs.push({
                    pt: row[iCol * 2],
                    col: iCol * 2,
                    w: cellsize + 2,
                    h: (cellsize * 1.5) + 2,
                    sym: pentW,
                    verts: ptsW,
                });
                pairs.push({
                    pt: row[(iCol * 2) + 1],
                    col: (iCol * 2) + 1,
                    w: cellsize + 2,
                    h: (cellsize * 1.5) + 2,
                    sym: pentE,
                    verts: ptsE,
                });
            } else {
                pairs.push({
                    pt: row[iCol * 2],
                    col: iCol * 2,
                    w: (cellsize * 1.5) + 2,
                    h: cellsize + 2,
                    sym: pentN,
                    verts: ptsN,
                });
                pairs.push({
                    pt: row[(iCol * 2) + 1],
                    col: (iCol * 2) + 1,
                    w: (cellsize * 1.5) + 2,
                    h: cellsize + 2,
                    sym: pentS,
                    verts: ptsS,
                });
            }
            for (const {pt, col, w, h, sym} of pairs) {
                if (blocked !== undefined && blocked.find(p => p.col === col && p.row === iRow) !== undefined) {
                    continue;
                }
                const c = gridlines.use(sym).size(w, h).center(pt.x, pt.y);
                if (ctx.options.boardClick !== undefined) {
                    c.click(() => ctx.options.boardClick!(iRow, col, ""));
                }
            }
            if (orientation === "H") {
                orientation = "V";
            } else {
                orientation = "H";
            }
        }
    }

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
        let hideHalf = false;
        if (ctx.json.options?.includes("hide-labels-half")) {
            hideHalf = true;
        }
        const labels = board.group().id("labels");
        let customLabels: string[]|undefined;
        if ( ("columnLabels" in boardTyped) && (boardTyped.columnLabels !== undefined) ) {
            customLabels = boardTyped.columnLabels;
        }
        let columnLabels = ctx.getLabels(customLabels, width);
        if ( (ctx.json.options !== undefined) && (ctx.json.options.includes("reverse-letters")) ) {
            columnLabels.reverse();
        }

        let rowLabels = ctx.getRowLabels(boardTyped.rowLabels, height);
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
        const realwidth = width * 2;
        // Columns (letters)
        for (let col = 0; col < realwidth; col += 2) {
            const pointTop = {x: (grid[0][col].x + grid[0][col+1].x) / 2, y: ((grid[0][col].y + grid[0][col+1].y) / 2) - (cellsize * 1.25)};
            const pointBottom = {x: (grid[height - 1][col].x + grid[height - 1][col+1].x) / 2, y: ((grid[height - 1][col].y + grid[height - 1][col+1].y) / 2) + (cellsize * 1.25)};
            if (! hideHalf) {
                labels.text(columnLabels[col / 2]).fill(labelColour).opacity(labelOpacity).center(pointTop.x, pointTop.y);
            }
            labels.text(columnLabels[col / 2]).fill(labelColour).opacity(labelOpacity).center(pointBottom.x, pointBottom.y);
        }

        // Rows (numbers)
        for (let row = 0; row < height; row++) {
            const pointL = {x: ((grid[row][0].x + grid[row][1].x) / 2) - (cellsize * 1.25), y: (grid[row][0].y + grid[row][1].y) / 2};
            const pointR = {x: ((grid[row][realwidth - 1].x + grid[row][realwidth - 2].x) / 2) + (cellsize * 1.25), y: (grid[row][realwidth - 1].y + grid[row][realwidth - 2].y) / 2};
            labels.text(rowLabels[row]).fill(labelColour).opacity(labelOpacity).center(pointL.x, pointL.y);
            if (! hideHalf) {
                labels.text(rowLabels[row]).fill(labelColour).opacity(labelOpacity).center(pointR.x, pointR.y);
            }
        }
    }

    ctx.markBoard({svgGroup: gridlines, preGridLines: false, grid, polys});

    return [grid, polys];
}
