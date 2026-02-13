import { Element as SVGElement, Rect as SVGRect } from "@svgdotjs/svg.js";
import { GridPoints, rectOfRects } from "../grids";
import { RendererBase } from "../renderers/_base";
import { CompassDirection, IBuffer } from ".";
import { rotatePoint, shortenLine } from "../common/plotting";
import { Graph, SquareFanoronaGraph, SquareGraph, SquareOrthGraph } from "../graphs";
import { calcStarPoints } from "../common/starPoints";

export const vertex = (ctx: RendererBase): GridPoints => {
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

    // Check for tiling
    let tilex = 0;
    let tiley = 0;
    let tileSpace = 0;
    let tileMult = 3;
    if (ctx.json.board.tileWidth !== undefined) {
        tilex = ctx.json.board.tileWidth;
    }
    if (ctx.json.board.tileHeight !== undefined) {
        tiley = ctx.json.board.tileHeight;
    }
    if (ctx.json.board.tileSpacing !== undefined) {
        tileSpace = ctx.json.board.tileSpacing;
    }
    if (ctx.json.board.tileLineMult !== undefined) {
        tileMult = ctx.json.board.tileLineMult;
    }

    // Get a grid of points
    const grid = rectOfRects({gridHeight: height, gridWidth: width, cellSize: cellsize, tileHeight: tiley, tileWidth: tilex, tileSpacing: tileSpace});
    const board = ctx.rootSvg.group().id("board");

    // have to define tiles early for clickable markers to work
    const tiles = board.group().id("tiles");
    const gridlines = board.group().id("gridlines");
    ctx.markBoard({svgGroup: gridlines, preGridLines: true, grid});

    // create buffer zone first if requested
    let bufferwidth = 0;
    let show: CompassDirection[] = ["N", "E", "S", "W"];
    if ( ("buffer" in ctx.json.board) && (ctx.json.board.buffer !== undefined) && ("width" in ctx.json.board.buffer) && (ctx.json.board.buffer.width !== undefined) && (ctx.json.board.buffer.width > 0) ) {
        bufferwidth = cellsize * (ctx.json.board.buffer as IBuffer).width!;
        if ( ("show" in ctx.json.board.buffer) && (ctx.json.board.buffer.show !== undefined) && (Array.isArray(ctx.json.board.buffer.show)) && ((ctx.json.board.buffer.show as string[]).length > 0) ) {
            show = [...(ctx.json.board.buffer as IBuffer).show!];
        }
        let pattern: string | undefined;
        if ( ("pattern" in ctx.json.board.buffer) && (ctx.json.board.buffer.pattern !== undefined) && (ctx.json.board.buffer.pattern.length > 0) ) {
            pattern = (ctx.json.board.buffer as IBuffer).pattern;
        }
        if (pattern !== undefined) {
            ctx.loadPattern(pattern);
        }
        let fill: SVGElement | undefined;
        if (pattern !== undefined) {
            fill = ctx.rootSvg.findOne(`#${pattern}`) as SVGElement;
            if (fill === undefined) {
                throw new Error("Could not load the fill for the buffer zone.");
            }
        }
        const colourEntries = (ctx.json.board.buffer as IBuffer).colours;
        let separated = false;
        if ( ("separated" in ctx.json.board.buffer) && ctx.json.board.buffer.separated !== undefined) {
            separated = ctx.json.board.buffer.separated;
        }
        const offset = cellsize * 0.2;

        // default, non-separated version first
        if (!separated) {
            // top
            let h = bufferwidth;
            let w = (grid[0][grid[0].length - 1].x + cellsize) - grid[0][0].x;
            let x = grid[0][0].x - (cellsize / 2);
            let y = grid[0][0].y - (cellsize / 2) - (h + offset);
            let buffN: SVGRect | undefined;
            if (show.includes("N")) {
                const key = "_buffer_N";
                buffN = board.rect(w, h).id(key)
                .stroke({color: baseColour, width: baseStroke, opacity: baseOpacity})
                .move(x, y);
            }
            // bottom
            x = grid[grid.length - 1][0].x - (cellsize / 2);
            y = grid[grid.length - 1][0].y + (cellsize / 2) + offset;
            let buffS: SVGRect | undefined;
            if (show.includes("S")) {
                const key = "_buffer_S";
                buffS = board.rect(w, h).id(key)
                .stroke({color: baseColour, width: baseStroke, opacity: baseOpacity})
                .move(x, y);
            }
            // left
            w = bufferwidth;
            h = (grid[grid.length - 1][0].y + cellsize) - grid[0][0].y;
            x = grid[0][0].x - (cellsize / 2) - (w + offset);
            y = grid[0][0].y - (cellsize / 2);
            let buffW: SVGRect | undefined;
            if (show.includes("W")) {
                const key = "_buffer_W";
                buffW = board.rect(w, h).id(key)
                .stroke({color: baseColour, width: baseStroke, opacity: baseOpacity})
                .move(x, y);
            }
            // right
            x = grid[0][grid[0].length - 1].x + (cellsize / 2) + offset;
            y = grid[0][0].y - (cellsize / 2);
            let buffE: SVGRect | undefined;
            if (show.includes("E")) {
                const key = "_buffer_E";
                buffE = board.rect(w, h).id(key)
                .stroke({color: baseColour, width: baseStroke, opacity: baseOpacity})
                .move(x, y);
            }

            // Fill and add click handlers to all four zones at once
            for (const buff of [buffN, buffS, buffW, buffE]) {
                if (buff === undefined) { continue; }
                if (colourEntries !== undefined) {
                    const dir = buff.id()[buff.id().length - 1];
                    const found = colourEntries.find(entry => entry.side === dir);
                    if (found === undefined) {
                        throw new Error(`Board buffers: You didn't provide a colour entry for the side ${dir}.`);
                    }
                    buff.fill({color: ctx.resolveColour(found.colour) as string});
                } else {
                    if (fill !== undefined) {
                        buff.fill(fill);
                    } else {
                        buff.fill({color: "white", opacity: 0})
                    }
                    if (ctx.options.boardClick !== undefined) {
                        buff.click((e: MouseEvent) => {
                            ctx.options.boardClick!(-1, -1, buff.id())
                            e.stopPropagation();
                        });
                    }
                }
            }
        }
        // now the separated version
        else {
            // N & S always include corner dots
            // E & W will only add them if one of N or S aren't present
            const shorten = 0.1;
            const multiple = 1 - (shorten * 2);
            // top
            if (show.includes("N")) {
                const h = bufferwidth;
                const w = cellsize * multiple;
                for (let i = 0; i < grid[0].length; i++) {
                    const ctr = grid[0][i];
                    const ytop = ctr.y - (cellsize / 2) - (h + offset);
                    const fullx1 = ctr.x - (cellsize / 2);
                    const fullx2 = ctr.x + (cellsize / 2);
                    const [tlx,,,] = shortenLine(fullx1, ytop, fullx2, ytop, shorten);
                    const buff = board.rect(w, h).id(`${i},-1`)
                        .stroke({color: baseColour, width: baseStroke, opacity: baseOpacity})
                        .move(tlx, ytop);
                    if (fill !== undefined) {
                        buff.fill(fill);
                    } else {
                        buff.fill({color: "white", opacity: 0})
                    }
                    if (ctx.options.boardClick !== undefined) {
                        buff.click((e: MouseEvent) => {
                            ctx.options.boardClick!(-1, -1, buff.id());
                            e.stopPropagation();
                        });
                    }
                }
                // always add corner dots
                const buffLeft = board.rect(bufferwidth, bufferwidth).id(`-1,-1`)
                        .stroke({color: baseColour, width: baseStroke, opacity: baseOpacity})
                        .move(grid[0][0].x - (cellsize / 2) - (bufferwidth + offset), grid[0][0].y - (cellsize / 2) - (bufferwidth + offset));
                if (fill !== undefined) {
                    buffLeft.fill(fill);
                } else {
                    buffLeft.fill({color: "white", opacity: 0})
                }
                if (ctx.options.boardClick !== undefined) {
                    buffLeft.click((e: MouseEvent) => {
                        ctx.options.boardClick!(-1, -1, buffLeft.id());
                        e.stopPropagation();
                    });
                }
                const buffRight = board.rect(bufferwidth, bufferwidth).id(`${grid[0].length},-1`)
                        .stroke({color: baseColour, width: baseStroke, opacity: baseOpacity})
                        .move(grid[0][grid[0].length - 1].x + (cellsize / 2) + offset, grid[0][grid[0].length - 1].y - (cellsize / 2) - (bufferwidth + offset));
                if (fill !== undefined) {
                    buffRight.fill(fill);
                } else {
                    buffRight.fill({color: "white", opacity: 0})
                }
                if (ctx.options.boardClick !== undefined) {
                    buffRight.click((e: MouseEvent) => {
                        ctx.options.boardClick!(-1, -1, buffRight.id());
                        e.stopPropagation();
                    });
                }
            }
            // bottom
            if (show.includes("S")) {
                const h = bufferwidth;
                const w = cellsize * multiple;
                for (let i = 0; i < grid[grid.length - 1].length; i++) {
                    const ctr = grid[grid.length - 1][i];
                    const ytop = ctr.y + (cellsize / 2) + (offset);
                    const fullx1 = ctr.x - (cellsize / 2);
                    const fullx2 = ctr.x + (cellsize / 2);
                    const [tlx,,,] = shortenLine(fullx1, ytop, fullx2, ytop, shorten);
                    const buff = board.rect(w, h).id(`${i},${grid.length}`)
                        .stroke({color: baseColour, width: baseStroke, opacity: baseOpacity})
                        .move(tlx, ytop);
                    if (fill !== undefined) {
                        buff.fill(fill);
                    } else {
                        buff.fill({color: "white", opacity: 0})
                    }
                    if (ctx.options.boardClick !== undefined) {
                        buff.click((e: MouseEvent) => {
                            ctx.options.boardClick!(-1, -1, buff.id());
                            e.stopPropagation();
                        });
                    }
                }
                // always add corner dots
                const buffLeft = board.rect(bufferwidth, bufferwidth).id(`-1,${grid.length}`)
                        .stroke({color: baseColour, width: baseStroke, opacity: baseOpacity})
                        .move(grid[grid.length - 1][0].x - (cellsize / 2) - (bufferwidth + offset), grid[grid.length - 1][0].y + (cellsize / 2) + offset);
                if (fill !== undefined) {
                    buffLeft.fill(fill);
                } else {
                    buffLeft.fill({color: "white", opacity: 0})
                }
                if (ctx.options.boardClick !== undefined) {
                    buffLeft.click((e: MouseEvent) => {
                        ctx.options.boardClick!(-1, -1, buffLeft.id());
                        e.stopPropagation();
                    });
                }
                const buffRight = board.rect(bufferwidth, bufferwidth).id(`${grid[grid.length - 1].length},${grid.length}`)
                        .stroke({color: baseColour, width: baseStroke, opacity: baseOpacity})
                        .move(grid[grid.length - 1][grid[grid.length - 1].length - 1].x + (cellsize / 2) + offset, grid[grid.length - 1][grid[grid.length - 1].length - 1].y + (cellsize / 2) + offset);
                if (fill !== undefined) {
                    buffRight.fill(fill);
                } else {
                    buffRight.fill({color: "white", opacity: 0})
                }
                if (ctx.options.boardClick !== undefined) {
                    buffRight.click((e: MouseEvent) => {
                        ctx.options.boardClick!(-1, -1, buffRight.id());
                        e.stopPropagation();
                    });
                }
            }
            // left
            if (show.includes("W")) {
                const w = bufferwidth;
                const h = cellsize * multiple;
                for (let i = 0; i < grid.length; i++) {
                    const ctr = grid[i][0];
                    const xtop = ctr.x - (cellsize / 2) - (w + offset);
                    const fully1 = ctr.y - (cellsize / 2);
                    const fully2 = ctr.y + (cellsize / 2);
                    const [,tly,,] = shortenLine(xtop, fully1, xtop, fully2, shorten);
                    const buff = board.rect(w, h).id(`-1,${i}`)
                        .stroke({color: baseColour, width: baseStroke, opacity: baseOpacity})
                        .move(xtop, tly);
                    if (fill !== undefined) {
                        buff.fill(fill);
                    } else {
                        buff.fill({color: "white", opacity: 0})
                    }
                    if (ctx.options.boardClick !== undefined) {
                        buff.click((e: MouseEvent) => {
                            ctx.options.boardClick!(-1, -1, buff.id());
                            e.stopPropagation();
                        });
                    }
                }
                // only add corner dots if not already present
                if (!show.includes("S")) {
                    const buffLeft = board.rect(bufferwidth, bufferwidth).id(`-1,${grid.length}`)
                            .stroke({color: baseColour, width: baseStroke, opacity: baseOpacity})
                            .move(grid[grid.length - 1][0].x - (cellsize / 2) - (bufferwidth + offset), grid[grid.length - 1][0].y + (cellsize / 2) + offset);
                    if (fill !== undefined) {
                        buffLeft.fill(fill);
                    } else {
                        buffLeft.fill({color: "white", opacity: 0})
                    }
                    if (ctx.options.boardClick !== undefined) {
                        buffLeft.click((e: MouseEvent) => {
                            ctx.options.boardClick!(-1, -1, buffLeft.id());
                            e.stopPropagation();
                        });
                    }
                }
                if (!show.includes("N")) {
                    const buffRight = board.rect(bufferwidth, bufferwidth).id(`-1,-1`)
                            .stroke({color: baseColour, width: baseStroke, opacity: baseOpacity})
                            .move(grid[0][0].x - (cellsize / 2) - (bufferwidth + offset), grid[0][0].y - (cellsize / 2) - (bufferwidth + offset));
                    if (fill !== undefined) {
                        buffRight.fill(fill);
                    } else {
                        buffRight.fill({color: "white", opacity: 0})
                    }
                    if (ctx.options.boardClick !== undefined) {
                        buffRight.click((e: MouseEvent) => {
                            ctx.options.boardClick!(-1, -1, buffRight.id());
                            e.stopPropagation();
                        });
                    }
                }
            }
            // right
            if (show.includes("E")) {
                const w = bufferwidth;
                const h = cellsize * multiple;
                for (let i = 0; i < grid.length; i++) {
                    const ctr = grid[i][grid[i].length - 1];
                    const xtop = ctr.x + (cellsize / 2) + (offset);
                    const fully1 = ctr.y - (cellsize / 2);
                    const fully2 = ctr.y + (cellsize / 2);
                    const [,tly,,] = shortenLine(xtop, fully1, xtop, fully2, shorten);
                    const buff = board.rect(w, h).id(`${grid[i].length},${i}`)
                        .stroke({color: baseColour, width: baseStroke, opacity: baseOpacity})
                        .move(xtop, tly);
                    if (fill !== undefined) {
                        buff.fill(fill);
                    } else {
                        buff.fill({color: "white", opacity: 0})
                    }
                    if (ctx.options.boardClick !== undefined) {
                        buff.click((e: MouseEvent) => {
                            ctx.options.boardClick!(-1, -1, buff.id());
                            e.stopPropagation();
                        });
                    }
                }
                // only add corner dots if not already present
                if (!show.includes("N")) {
                    const buffLeft = board.rect(bufferwidth, bufferwidth).id(`${grid[0].length},-1`)
                            .stroke({color: baseColour, width: baseStroke, opacity: baseOpacity})
                            .move(grid[0][grid[0].length - 1].x + (cellsize / 2) + offset, grid[0][grid[0].length - 1].y - (cellsize / 2) - (bufferwidth + offset));
                    if (fill !== undefined) {
                        buffLeft.fill(fill);
                    } else {
                        buffLeft.fill({color: "white", opacity: 0})
                    }
                    if (ctx.options.boardClick !== undefined) {
                        buffLeft.click((e: MouseEvent) => {
                            ctx.options.boardClick!(-1, -1, buffLeft.id());
                            e.stopPropagation();
                        });
                    }
                }
                if (!show.includes("S")) {
                    const buffRight = board.rect(bufferwidth, bufferwidth).id(`${grid[grid.length - 1].length},${grid.length}`)
                            .stroke({color: baseColour, width: baseStroke, opacity: baseOpacity})
                            .move(grid[grid.length - 1][grid[grid.length - 1].length - 1].x + (cellsize / 2) + offset, grid[grid.length - 1][grid[grid.length - 1].length - 1].y + (cellsize / 2) + offset);
                    if (fill !== undefined) {
                        buffRight.fill(fill);
                    } else {
                        buffRight.fill({color: "white", opacity: 0})
                    }
                    if (ctx.options.boardClick !== undefined) {
                        buffRight.click((e: MouseEvent) => {
                            ctx.options.boardClick!(-1, -1, buffRight.id());
                            e.stopPropagation();
                        });
                    }
                }
            }
        }
        bufferwidth += offset;
    }

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
            const pointTop = {x: grid[0][col].x, y: grid[0][col].y - (cellsize) - (show.includes("N") ? bufferwidth : 0)};
            const pointBottom = {x: grid[height - 1][col].x, y: grid[height - 1][col].y + (cellsize) + (show.includes("S") ? bufferwidth : 0)};
            if (! hideHalf) {
                labels.text(columnLabels[col]).fill(labelColour).opacity(labelOpacity).center(pointTop.x, pointTop.y);
            }
            labels.text(columnLabels[col]).fill(labelColour).opacity(labelOpacity).center(pointBottom.x, pointBottom.y);
        }

        // Rows (numbers)
        for (let row = 0; row < height; row++) {
            const pointL = {x: grid[row][0].x - (cellsize) - (show.includes("W") ? bufferwidth : 0), y: grid[row][0].y};
            const pointR = {x: grid[row][width - 1].x + (cellsize) + (show.includes("E") ? bufferwidth : 0), y: grid[row][width - 1].y};
            labels.text(rowLabels[row]).fill(labelColour).opacity(labelOpacity).center(pointL.x, pointL.y);
            if (! hideHalf) {
                labels.text(rowLabels[row]).fill(labelColour).opacity(labelOpacity).center(pointR.x, pointR.y);
            }
        }
    }

    // Draw grid lines
    // use graphs to determine connections and then draw each connection
    let graph: Graph;
    if (style === "vertex-cross") {
        graph = new SquareGraph(width, height);
    } else if (style === "vertex-fanorona") {
        graph = new SquareFanoronaGraph(width, height);
    } else {
        graph = new SquareOrthGraph(width, height);
    }

    type Blocked = [{row: number;col: number;},...{row: number;col: number;}[]];
    let blocked: Blocked|undefined;
    if ( (ctx.json.board.blocked !== undefined) && (ctx.json.board.blocked !== null) && (Array.isArray(ctx.json.board.blocked)) && (ctx.json.board.blocked.length > 0) ){
        blocked = [...(ctx.json.board.blocked as Blocked)];
    }
    if (blocked !== undefined) {
        for (const entry of blocked) {
            graph.dropNode([entry.col, entry.row]);
        }
    }

    // Horizontal, top of each row, then bottom line after loop
    let numcols = 1;
    if (tilex > 0) {
        numcols = Math.floor(width / tilex);
    }
    for (let tileCol = 0; tileCol < numcols; tileCol++) {
        let idxLeft = 0;
        if (tilex > 0) {
            idxLeft = tileCol * tilex;
        }
        let idxRight = width - 1;
        if (tilex > 0) {
            idxRight = idxLeft + tilex;
            if ( (tileSpace > 0) || (idxRight === width) ) {
                idxRight--;
            }
        }
        for (let row = 0; row < height; row++) {
            if ( (ctx.json.options) && (ctx.json.options.includes("no-border")) ) {
                if ( (row === 0) || (row === height - 1) ) {
                    continue;
                }
            }
            let thisStroke = baseStroke;
            if (blocked === undefined) {
                if ( (tiley > 0) && (tileSpace === 0) && (row > 0) && (row % tiley === 0) ) {
                    thisStroke = baseStroke * tileMult;
                } else if (tiley === 0 && (row === 0 || row === height - 1)) {
                    thisStroke = baseStroke * 2;
                }
            }
            for (let idxX = idxLeft; idxX < idxRight; idxX++) {
                if (graph.sharesEdge([idxX, row], [idxX+1, row])) {
                    const x1 = grid[row][idxX].x;
                    const y1 = grid[row][idxX].y;
                    const x2 = grid[row][idxX+1].x;
                    const y2 = grid[row][idxX+1].y;
                    gridlines.line(x1, y1, x2, y2).stroke({width: thisStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"}).attr({ 'pointer-events': 'none' });
                }
            }
        }
    }

    // Vertical, left of each column, then right line after loop
    let numrows = 1;
    if (tiley > 0) {
        numrows = Math.floor(height / tiley);
    }
    for (let tileRow = 0; tileRow < numrows; tileRow++) {
        let idxTop = 0;
        if (tiley > 0) {
            idxTop = tileRow * tiley;
        }
        let idxBottom = height - 1;
        if (tiley > 0) {
            idxBottom = idxTop + tiley;
            if ( (tileSpace > 0) || (idxBottom === height) ) {
                idxBottom--;
            }
        }
        for (let col = 0; col < width; col++) {
            if ( (ctx.json.options) && (ctx.json.options.includes("no-border")) ) {
                if ( (col === 0) || (col === width - 1) ) {
                    continue;
                }
            }
            let thisStroke = baseStroke;
            if (blocked === undefined) {
                if ( (tilex > 0) && (tileSpace === 0) && (col > 0) && (col % tilex === 0) ) {
                    thisStroke = baseStroke * tileMult;
                } else if (tilex === 0 && (col === 0 || col === width - 1)) {
                    thisStroke = baseStroke * 2;
                }
            }
            for (let idxY = idxTop; idxY < idxBottom; idxY++) {
                if (graph.sharesEdge([col, idxY], [col, idxY+1])) {
                    const x1 = grid[idxY][col].x;
                    const y1 = grid[idxY][col].y;
                    const x2 = grid[idxY+1][col].x;
                    const y2 = grid[idxY+1][col].y;
                    gridlines.line(x1, y1, x2, y2).stroke({width: thisStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"}).attr({ 'pointer-events': 'none' });
                }
            }
        }
    }

    // If `-cross` board, add crosses
    if (style === "vertex-cross") {
        for (let tileRow = 0; tileRow < numrows; tileRow++) {
            for (let tileCol = 0; tileCol < numcols; tileCol++) {
                const tileHeight = Math.floor(height / numrows);
                const tileWidth = Math.floor(width / numcols);
                let rowFirst = tileRow * tileHeight;
                if ( (rowFirst === 0) || (tileSpace > 0) ) {
                    rowFirst++;
                }
                const rowLast = (tileRow * tileHeight) + tileHeight - 1;
                const colFirst = tileCol * tileWidth;
                let colLast = (tileCol * tileWidth) + tileWidth - 1;
                if ( (colLast < width - 1) && (tileSpace === 0) ) {
                    colLast++;
                }
                for (let row = rowFirst; row <= rowLast; row++) {
                    for (let col = colFirst; col <= colLast; col++) {
                        const curr = grid[row][col];
                        // if not last column, do next
                        if (col < colLast) {
                            if (graph.sharesEdge([col, row], [col+1, row-1])) {
                                const next = grid[row - 1][col + 1];
                                gridlines.line(curr.x, curr.y, next.x, next.y).stroke({width: baseStroke / 2, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"}).attr({ 'pointer-events': 'none' });
                            }
                        }
                        // if not first column, do previous
                        if (col > colFirst) {
                            if (graph.sharesEdge([col, row], [col-1, row-1])) {
                                const prev = grid[row - 1][col - 1];
                                gridlines.line(curr.x, curr.y, prev.x, prev.y).stroke({width: baseStroke / 2, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"}).attr({ 'pointer-events': 'none' });
                            }
                        }
                    }
                }
            }
        }
    } else if (style === "vertex-fanorona") {
        for (let tileRow = 0; tileRow < numrows; tileRow++) {
            for (let tileCol = 0; tileCol < numcols; tileCol++) {
                const tileHeight = Math.floor(height / numrows);
                const tileWidth = Math.floor(width / numcols);
                const rowFirst = tileRow * tileHeight;
                const rowLast = (tileRow * tileHeight) + tileHeight - 1;
                const colFirst = tileCol * tileWidth;
                const colLast = (tileCol * tileWidth) + tileWidth - 1;
                // only go to the second-to-last row
                for (let row = rowFirst; row < rowLast; row++) {
                    // connect down-left and down-right depending on row and col
                    for (let col = colFirst; col <= colLast; col++) {
                        const curr = grid[row][col];
                        let connect = false;
                        if ( ( (row % 2 === 0) && (col % 2 === 0) ) || ( (row % 2 !== 0) && (col % 2 !== 0) ) ){
                            connect = true;
                        }
                        if (connect) {
                            // if not last column, do next
                            if (col < colLast) {
                                if (graph.sharesEdge([col, row], [col+1, row+1])) {
                                    const next = grid[row + 1][col + 1];
                                    gridlines.line(curr.x, curr.y, next.x, next.y).stroke({width: baseStroke / 2, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"}).attr({ 'pointer-events': 'none' });
                                }
                            }
                            // if not first column, do previous
                            if (col > colFirst) {
                                if (graph.sharesEdge([col, row], [col-1, row+1])) {
                                    const prev = grid[row + 1][col - 1];
                                    gridlines.line(curr.x, curr.y, prev.x, prev.y).stroke({width: baseStroke / 2, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"}).attr({ 'pointer-events': 'none' });
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (ctx.options.boardClick !== undefined) {
        if ( (ctx.json.renderer !== "stacking-offset") && (tileSpace === 0) ) {
            const rotation = ctx.getRotation();
            const centre = ctx.getBoardCentre();
            const clickDeltaX: number = (ctx.json.board.clickDeltaX ?? 0);
            const clickDeltaY: number = (ctx.json.board.clickDeltaX ?? 0);
            const originX = grid[0][0].x;
            const originY = grid[0][0].y;
            // const maxX = grid[0][grid[0].length - 1].x;
            // const maxY = grid[grid.length - 1][0].y;
            const root = ctx.rootSvg;
            let genericCatcher = ((e: { clientX: number; clientY: number; }) => {
                const point = rotatePoint(root.point(e.clientX, e.clientY), rotation*-1, centre);
                const x = Math.floor((point.x - (originX - (cellsize / 2))) / cellsize);
                const y = Math.floor((point.y - (originY - (cellsize / 2))) / cellsize);
                if (x >= 0 - clickDeltaX && x < width + clickDeltaX && y >= 0 - clickDeltaY && y < height + clickDeltaY) {
                    // // try to cull double click handlers with buffer zones by making the generic handler less sensitive at the edges
                    // if ( (bufferwidth === 0) || ( (point.x >= originX) && (point.x <= maxX) && (point.y >= originY) && (point.y <= maxY) ) ) {
                        ctx.options.boardClick!(y, x, "");
                    // }
                }
            });
            if (ctx.options.rotate === 180) {
                genericCatcher = ((e: { clientX: number; clientY: number; }) => {
                    const point = rotatePoint(root.point(e.clientX, e.clientY), rotation*-1, centre);
                    const x = width - Math.floor((point.x - (originX - (cellsize / 2))) / cellsize) - 1;
                    const y = height - Math.floor((point.y - (originY - (cellsize / 2))) / cellsize) - 1;
                    if (x >= 0 - clickDeltaX && x < width + clickDeltaX && y >= 0 - clickDeltaY && y < height + clickDeltaY) {
                        // // try to cull double click handlers with buffer zones by making the generic handler less sensitive at the edges
                        // if ( (bufferwidth === 0) || ( (point.x >= originX) && (point.x <= maxX) && (point.y >= originY) && (point.y <= maxY) ) ) {
                            ctx.options.boardClick!(y, x, "");
                        // }
                    }
                });
            }
            ctx.rootSvg.click(genericCatcher);
        } else {
            const tile = ctx.rootSvg.defs().rect(ctx.cellsize, ctx.cellsize).fill(ctx.options.colourContext.background).opacity(0).id("_clickCatcher");
            for (let row = 0; row < grid.length; row++) {
                for (let col = 0; col < grid[row].length; col++) {
                    if (graph.hasNode([col, row])) {
                        const {x, y} = grid[row][col];
                        const t = tiles.use(tile).dmove(x - (cellsize / 2), y - (cellsize / 2));
                        t.click(() => ctx.options.boardClick!(row, col, ""));
                    }
                }
            }
        }
    }

    // If square `vertex` board, not tiled, and no blocked cells, consider adding star points
    if (style === "vertex" && width === height && tileSpace === 0 && blocked === undefined && (ctx.json.options === undefined || !ctx.json.options.includes("hide-star-points"))) {
        const pts = calcStarPoints(width);
        pts.forEach((p) => {
            const pt = grid[p[0]][p[1]];
            gridlines.circle(baseStroke * 7.5)
                .attr({ 'pointer-events': 'none' })
                .fill(baseColour)
                .opacity(baseOpacity)
                .stroke({width: 0})
                .center(pt.x, pt.y);
        });
        // add ghost points
        const total = Math.ceil(width / 6)**2;
        for (let i = 0; i < total - pts.length; i++) {
            gridlines.circle(baseStroke * 7.5)
                .id(`aprender-ghost-star-${i+1}`)
                .attr({ 'pointer-events': 'none' })
                .fill(baseColour)
                .opacity(0)
                .stroke({width: 0})
                .center(0,0);
        }
    }

    ctx.markBoard({svgGroup: gridlines, preGridLines: false, grid});

    return grid;
}
