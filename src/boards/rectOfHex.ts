import { centroid } from "../common/plotting";
import { edges2corners, pts2id } from ".";
import { GridPoints, IPoint, IPolyPolygon } from "../grids";
import { RendererBase } from "../renderers/_base";
import { Grid, defineHex, Orientation, HexOffset, rectangle } from "honeycomb-grid";

export const rectOfHex = (ctx: RendererBase): [GridPoints, IPolyPolygon[][]] => {
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
    const style = ctx.json.board.style;

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
    let orientation = Orientation.POINTY;
    if (style.endsWith("f")) {
        orientation = Orientation.FLAT;
    }
    const edges = edges2corners.get(orientation)!;
    let offset: HexOffset = -1;
    if (style.includes("-even")) {
        offset = 1;
    }

    const myHex = defineHex({
        offset,
        orientation,
        dimensions: cellsize,
    });
    const grid = new Grid(myHex, rectangle({width, height}));
    const board = ctx.rootSvg.group().id("board");
    const gridPoints: GridPoints = [];
    // const {x: cx, y: cy} = grid.getHex({col: 0, row: 0})!.center;
    const polys: IPolyPolygon[][] = [];
    for (let y = 0; y < height; y++) {
        const rowPolys: IPolyPolygon[] = [];
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

    const cells = board.group().id("cells");
    const labels = board.group().id("labels");
    let labelStyle: "internal"|"external" = "internal";
    if ("labelStyle" in ctx.json.board && ctx.json.board.labelStyle !== undefined && ctx.json.board.labelStyle !== null) {
        labelStyle = ctx.json.board.labelStyle;
    }
    const fontSize = ctx.cellsize / 5;
    const seenEdges = new Set<string>();
    let customLabels: string[]|undefined;
    if ( ("columnLabels" in ctx.json.board) && (ctx.json.board.columnLabels !== undefined) ) {
        customLabels = ctx.json.board.columnLabels;
    }
    let rowLabels = ctx.getLabels(customLabels, height);
    rowLabels.reverse();
    if ( (ctx.json.options !== undefined) && (ctx.json.options.includes("reverse-letters")) ) {
        rowLabels.reverse();
    }

    let columnLabels = ctx.getRowLabels(ctx.json.board.rowLabels, width);
    columnLabels.reverse();
    if ( (ctx.json.options !== undefined) && (ctx.json.options.includes("reverse-numbers")) ) {
        columnLabels.reverse();
    }

    if (ctx.json.options?.includes("swap-labels")) {
        const scratch = [...columnLabels];
        columnLabels = [...rowLabels];
        columnLabels.reverse();
        rowLabels = [...scratch];
        rowLabels.reverse();
    }

    let labelGrid: string[][]|undefined;
    if ("labelGrid" in ctx.json.board && ctx.json.board.labelGrid !== undefined && ctx.json.board.labelGrid !== null && Array.isArray(ctx.json.board.labelGrid)) {
        labelGrid = ctx.json.board.labelGrid.map(row => [...row]);
    }

    let labelColour = ctx.options.colourContext.labels;
    if ( ("labelColour" in ctx.json.board) && (ctx.json.board.labelColour !== undefined) ) {
        labelColour = ctx.resolveColour(ctx.json.board.labelColour) as string;
    }
    let labelOpacity = 1;
    if ( ("labelOpacity" in ctx.json.board) && (ctx.json.board.labelOpacity !== undefined) ) {
        labelOpacity = ctx.json.board.labelOpacity;
    }
    const rotation = ctx.getRotation();
    for (const hex of grid) {
        // don't draw "blocked" hexes
        if (blocked !== undefined) {
            const found = blocked.find(e => e.row === hex.row && e.col === hex.col);
            if (found !== undefined) {
                continue;
            }
        }
        const { x, y } = hex;
        const used = cells.use(symbolPoly).size(cellsize, cellsize).translate(x, y);
        if ( ( (! ctx.json.options) || (! ctx.json.options.includes("hide-labels") ) ) && (labelStyle === "internal") ) {
            let label: string;
            if (labelGrid === undefined) {
                const components: string[] = [];
                components.push(columnLabels[hex.col]);
                components.push(rowLabels[hex.row]);
                if (/^\d+$/.test(components[0])) {
                    components.reverse();
                }
                label = components.join("");
            } else {
                label = "?";
                if (hex.row < labelGrid.length) {
                    if (hex.col < labelGrid[hex.row].length) {
                        label = labelGrid[hex.row][hex.col];
                    }
                }
            }

            let labelX = corners[5].x;
            let labelY = corners[5].y;
            const transX = x;
            let transY = y + fontSize;
            if (rotation > 90 && rotation < 270) {
                labelX = corners[2].x;
                labelY = corners[2].y;
                transY = y - fontSize;
            }
            if (style.endsWith("f")) {
                labelX = (corners[5].x + corners[0].x) / 2;
                labelY = (corners[5].y + corners[0].y) / 2;
                transY = y + (fontSize / 2);
                if (rotation > 90 && rotation < 270) {
                    labelX = (corners[3].x + corners[2].x) / 2;
                    labelY = (corners[3].y + corners[2].y) / 2;
                    transY = y - (fontSize / 2);
                }
            }
            labels.text(label)
            .font({
                anchor: "middle",
                fill: labelColour,
                size: fontSize,
                opacity: labelOpacity,
            })
            // .center(cx, cy);
            .center(labelX, labelY)
            .translate(transX, transY);
        }
        if (ctx.options.boardClick !== undefined) {
            used.click(() => ctx.options.boardClick!(hex.row, hex.col, ""));
        }
    }

    // external labels, if requested
    // Add board labels
    if (labelStyle === "external" && labelGrid === undefined) {
        let hideHalf = false;
        if (ctx.json.options?.includes("hide-labels-half")) {
            hideHalf = true;
        }
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        polys.flat().forEach(hex => {
            hex.points.forEach(({x,y}) => {
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            });
        });

        // Columns
        // if flat, columns are straight lines
        // if pointy, place at minimum of first and second row centre points
        for (let col = 0; col < width; col++) {
            const hex = polys[0][col];
            const {x: cx} = centroid(hex.points)!;
            let pointTop: IPoint;
            let pointBottom: IPoint;
            if (style.endsWith("-f")) {
                pointTop = {x: cx, y: minY - (cellsize * 0.5)};
                pointBottom = {x: cx, y: maxY + (cellsize * 0.5)};
            } else {
                if (style.includes("-even")) {
                    pointTop = {x: cx - (cellsize * 1), y: minY - (cellsize * 0.5)};
                    pointBottom = {x: cx - (cellsize * 1), y: maxY + (cellsize * 0.5)};
                } else {
                    pointTop = {x: cx, y: minY - (cellsize * 0.5)};
                    pointBottom = {x: cx, y: maxY + (cellsize * 0.5)};
                }
            }
            if (! hideHalf) {
                labels.text(columnLabels[col]).fill(labelColour).opacity(labelOpacity).center(pointTop.x, pointTop.y);
            }
            labels.text(columnLabels[col]).fill(labelColour).opacity(labelOpacity).center(pointBottom.x, pointBottom.y);
        }

        // Rows
        // if pointy, rows are straight lines
        // if flat, place at minimum of first and second row centre points
        for (let row = 0; row < height; row++) {
            const hex = polys[row][0];
            const {y: cy} = centroid(hex.points)!;
            let pointL: IPoint;
            let pointR: IPoint;
            if (style.endsWith("-p")) {
                pointL = {x: minX - (cellsize * 0.5), y: cy};
                pointR = {x: maxX + (cellsize * 0.5), y: cy};
            } else {
                if (style.includes("-even")) {
                    pointL = {x: minX - (cellsize * 0.5), y: cy};
                    pointR = {x: maxX + (cellsize * 0.5), y: cy};
                } else {
                    pointL = {x: minX - (cellsize * 0.5), y: cy};
                    pointR = {x: maxX + (cellsize * 0.5), y: cy};
                }
            }
            labels.text(rowLabels[row]).fill(labelColour).opacity(labelOpacity).center(pointL.x, pointL.y);
            if (! hideHalf) {
                labels.text(rowLabels[row]).fill(labelColour).opacity(labelOpacity).center(pointR.x, pointR.y);
            }
        }
    }

    if (clickEdges) {
        const gEdges = board.group().id("edges").insertBefore(labels);
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
                const edgeLine = gEdges.line(x1, y1, x2, y2).stroke({ width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round" }).translate(x,y);
                edgeLine.click(() => ctx.options.boardClick!(hex.row, hex.col, edge.dir));
            }
        }
    }

    ctx.markBoard({svgGroup: board, preGridLines: false, grid: gridPoints, hexGrid: grid, hexWidth: width, hexHeight: height, polys});

    return [gridPoints, polys];
}
