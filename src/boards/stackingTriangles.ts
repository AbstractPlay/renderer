import { centroid } from "../common/plotting";
import { edges2corners, pts2id } from ".";
import { GridPoints, IPoint, IPolyPolygon, Poly } from "../grids";
import { RendererBase } from "../renderers/_base";
import { defineHex, Grid, HexOffset, Orientation, rectangle } from "honeycomb-grid";

/**
 * This is a specialized subset of the rectOfHex function, specifically:
 * `hex-even-p` configuration with external, swapped labels and reversed numbers
 * multiplied by three, in different colours. It was simpler than trying to generalize.
 * It relies on a third-party library to do the heavy lifting.
 *
 * @returns A map of row/column locations to x,y coordinate
 */
export const stackingTriangles = (ctx: RendererBase): {points: GridPoints, polys: Poly[][]} => {
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
    const cellsize = ctx.cellsize * 0.8;

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
    let clickEdges = false;
    if ( (ctx.json.options !== undefined) && (ctx.json.options.includes("clickable-edges")) ) {
        clickEdges = (ctx.options.boardClick !== undefined);
    }

    // Get a grid of points
    const orientation = Orientation.POINTY;
    const edges = edges2corners.get(orientation)!;
    const offset: HexOffset = 1;


    const myHex = defineHex({
        offset,
        orientation,
        dimensions: cellsize,
    });
    const grid = new Grid(myHex, rectangle({width, height}));
    const board = ctx.rootSvg.group().id("board");
    const gridPoints: GridPoints = [];
    // const {x: cx, y: cy} = grid.getHex({col: 0, row: 0})!.center;
    const polys: Poly[][] = [];
    for (let y = 0; y < height; y++) {
        const rowPolys: Poly[] = [];
        const node: IPoint[] = [];
        for (let x = 0; x < width; x++) {
            const hex = grid.getHex({col: x, row: y});
            if (hex === undefined) {
                throw new Error();
            }
            // const pt = hex.toPoint();
            // node.push({x: hex.x + cx, y: hex.y + cy} as IPoint);
            node.push({x: hex.x, y: hex.y} as IPoint);
            rowPolys.push({
                type: "poly",
                points: hex.corners
            });
        }
        gridPoints.push(node);
        polys.push(rowPolys);
    }

    ctx.markBoard({svgGroup: board, preGridLines: true, grid: gridPoints, hexGrid: grid, hexWidth: width, hexHeight: height, polys});

    const corners = grid.getHex({col: 0, row: 0})!.corners;
    const vbx = Math.min(...corners.map(pt => pt.x));
    const vby = Math.min(...corners.map(pt => pt.y));
    const vbWidth = Math.max(...corners.map(pt => pt.x)) - vbx;
    const vbHeight = Math.max(...corners.map(pt => pt.y)) - vby;
    // const hexSymbol = ctx.rootSvg.defs().symbol().id("hex-symbol")
    //     .polygon(corners.map(({ x, y }) => `${x},${y}`).join(" "))
    //     .fill({color: "white", opacity: 0}).id("hex-symbol-poly");
    const hexSymbol = ctx.rootSvg.defs().symbol().id("hex-symbol").viewbox(vbx, vby, vbWidth, vbHeight);
    const symbolPoly = hexSymbol.polygon(corners.map(({ x, y }) => `${x},${y}`).join(" "))
                        .fill({color: "white", opacity: 0}).id("hex-symbol-poly");
    if (! clickEdges) {
        symbolPoly.stroke({ width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round" });
    }

    type Blocked = [{row: number;col: number;},...{row: number;col: number;}[]];
    let blocked: Blocked|undefined;
    if ( (ctx.json.board.blocked !== undefined) && (ctx.json.board.blocked !== null) && (Array.isArray(ctx.json.board.blocked)) && (ctx.json.board.blocked.length > 0) ){
        blocked = [...(ctx.json.board.blocked as Blocked)];
    }

    const labels = board.group().id("labels");
    const seenEdges = new Set<string>();
    let customLabels: string[]|undefined;
    if ( ("columnLabels" in ctx.json.board) && (ctx.json.board.columnLabels !== undefined) ) {
        customLabels = ctx.json.board.columnLabels;
    }
    const columnLabels = ctx.getLabels(customLabels, width * 2);

    const rowLabels = ctx.getRowLabels(ctx.json.board.rowLabels, height * 3);
    rowLabels.reverse();

    let labelColour = ctx.options.colourContext.labels;
    if ( ("labelColour" in ctx.json.board) && (ctx.json.board.labelColour !== undefined) ) {
        labelColour = ctx.resolveColour(ctx.json.board.labelColour) as string;
    }
    let labelOpacity = 1;
    if ( ("labelOpacity" in ctx.json.board) && (ctx.json.board.labelOpacity !== undefined) ) {
        labelOpacity = ctx.json.board.labelOpacity;
    }
    for (const hex of grid) {
        // don't draw "blocked" hexes
        if (blocked !== undefined) {
            const found = blocked.find(e => e.row === hex.row && e.col === hex.col);
            if (found !== undefined) {
                continue;
            }
        }
        const { x, y } = hex;
        const used = board.use(symbolPoly).size(cellsize, cellsize).translate(x, y);
        if (ctx.options.boardClick !== undefined) {
            used.click(() => ctx.options.boardClick!(hex.row, hex.col, ""));
        }
    }

    // Add board labels
    let hideHalf = false;
    if (ctx.json.options?.includes("hide-labels-half")) {
        hideHalf = true;
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    (polys.flat() as IPolyPolygon[]).forEach(hex => {
        hex.points.forEach(({x,y}) => {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
        });
    });

    // Columns
    for (let col = 0; col < width; col++) {
        let skipped: string[] = [];
        if ( ("skipLabels" in ctx.json.board) && (ctx.json.board.skipLabels !== undefined) ) {
            skipped = ctx.json.board.skipLabels as string[];
        }
        const hex = polys[0][col] as IPolyPolygon;
        const {x: cx} = centroid(hex.points)!;
        for (let inc = 0; inc < 2; inc++) {
            const label = columnLabels[(col * 2) + inc]
            let pointTop: IPoint;
            let pointBottom: IPoint;
            if (inc === 0) {
                pointTop = {x: hex.points[4].x, y: minY - (cellsize * 0.5)};
                pointBottom = {x: hex.points[4].x, y: maxY + (cellsize * 0.5)};
            } else {
                pointTop = {x: cx, y: minY - (cellsize * 0.5)};
                pointBottom = {x: cx, y: maxY + (cellsize * 0.5)};
            }
            if (! skipped.includes(label)) {
                if (! hideHalf) {
                    labels.text(label).fill(labelColour).opacity(labelOpacity).center(pointTop.x, pointTop.y);
                }
                labels.text(label).fill(labelColour).opacity(labelOpacity).center(pointBottom.x, pointBottom.y);
            }
        }
    }

    // Rows
    // rows are straight lines
    for (let row = 0; row < height; row++) {
        const hex = polys[row][0] as IPolyPolygon;
        const {y: cy} = centroid(hex.points)!;
        let localOpacity = labelOpacity;
        for (let inc = 0; inc < 3; inc++) {
            let pointL: IPoint;
            let pointR: IPoint;
            switch (inc) {
                case 0:
                    pointL = {x: minX - (cellsize * 0.5), y: cy};
                    pointR = {x: maxX + (cellsize * 0.5), y: cy};
                    break;
                case 1:
                    pointL = {x: minX - (cellsize * 0.5), y: hex.points[1].y};
                    pointR = {x: maxX + (cellsize * 0.5), y: hex.points[1].y};
                    localOpacity *= 0.66;
                    break;
                case 2:
                    pointL = {x: minX - (cellsize * 0.5), y: hex.points[2].y};
                    pointR = {x: maxX + (cellsize * 0.5), y: hex.points[2].y};
                    localOpacity *= 0.33;
                    break;
                default:
                    throw new Error(`Invalid increment`);
            }
            const label = rowLabels[(row * 3) + inc];
            labels.text(label).fill(labelColour).opacity(localOpacity).center(pointL.x, pointL.y);
            if (! hideHalf) {
                labels.text(label).fill(labelColour).opacity(localOpacity).center(pointR.x, pointR.y);
            }
        }
    }

    if (clickEdges) {
        for (const hex of grid) {
            // add clickable edges
            // don't draw "blocked" hexes
            if (blocked !== undefined) {
                const found = blocked.find(e => e.row === hex.row && e.col === hex.col);
                if (found !== undefined) {
                    continue;
                }
            }
            const { x, y } = hex;
            for (const edge of edges) {
                const [idx1, idx2] = edge.corners;
                const {x: x1, y: y1} = corners[idx1];
                const {x: x2, y: y2} = corners[idx2];
                const vid = pts2id([x1+x,y1+y],[x2+x,y2+y]);
                if (seenEdges.has(vid)) {
                    continue;
                }
                seenEdges.add(vid);
                const edgeLine = board.line(x1, y1, x2, y2).stroke({ width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round" }).translate(x,y);
                edgeLine.click(() => ctx.options.boardClick!(hex.row, hex.col, edge.dir));
            }
        }
    }

    ctx.markBoard({svgGroup: board, preGridLines: false, grid: gridPoints, hexGrid: grid, hexWidth: width, hexHeight: height, polys});

    return {points: gridPoints, polys};
}
