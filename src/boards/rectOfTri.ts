import { Element as SVGElement, Rect as SVGRect } from "@svgdotjs/svg.js";
import { CompassDirection, IBuffer } from ".";
import { GridPoints, hexOfTri } from "../grids";
import { RendererBase } from "../renderers/_base";

export const rectOfTri = (ctx: RendererBase): GridPoints => {
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
    let start: "W"|"N" = "W";
    if (("triStart" in ctx.json.board) && (ctx.json.board.triStart !== undefined)) {
        start = ctx.json.board.triStart;
    }

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
    // start with appropriate hexOfTri
    // add one to height if narrow start (initial grid must start wide)
    let effHeight = height + (start === "N" ? 1 : 0);
    // add another if effHeight is even (need the last row to be wide too to strip properly)
    if (effHeight % 2 === 0) {
        effHeight++;
    }
    let grid = hexOfTri({gridWidthMin: width, gridWidthMax: width + (Math.floor(effHeight / 2)), cellSize: cellsize});
    // now strip the unnecessary side points
    // assuming top and bottom are always wide
    const midrow = Math.floor(effHeight / 2);
    for (let row = 0; row < effHeight; row++) {
        const dist = Math.abs(midrow - row);
        const toDel = Math.ceil((midrow - dist) / 2);
        for (let i = 0; i < toDel; i++) {
            grid[row].pop();
            grid[row].shift();
        }
    }
    // if narrow start, pop the first row
    if (start === "N") {
        grid.shift();
    }
    // truncate grid to requested height
    grid = grid.slice(0, height);

    const board = ctx.rootSvg.group().id("board");

    // have to define tiles early for clickable markers to work
    const tiles = board.group().id("tiles");
    const gridlines = board.group().id("gridlines");
    ctx.markBoard({svgGroup: gridlines, preGridLines: true, grid});

    // create buffer zone first if requested
    // going to skip separated buffers for this board style
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
            const wideRow = start === "W" ? 0 : 1;
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
            x = grid[wideRow][0].x - (cellsize / 2) - (w + offset);
            y = grid[0][0].y - (cellsize / 2);
            let buffW: SVGRect | undefined;
            if (show.includes("W")) {
                const key = "_buffer_W";
                buffW = board.rect(w, h).id(key)
                .stroke({color: baseColour, width: baseStroke, opacity: baseOpacity})
                .move(x, y);
            }
            // right
            x = grid[wideRow][grid[wideRow].length - 1].x + (cellsize / 2) + offset;
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
        //     // N & S always include corner dots
        //     // E & W will only add them if one of N or S aren't present
        //     const shorten = 0.1;
        //     const multiple = 1 - (shorten * 2);
        //     // top
        //     if (show.includes("N")) {
        //         const h = bufferwidth;
        //         const w = cellsize * multiple;
        //         for (let i = 0; i < grid[0].length; i++) {
        //             const ctr = grid[0][i];
        //             const ytop = ctr.y - (cellsize / 2) - (h + offset);
        //             const fullx1 = ctr.x - (cellsize / 2);
        //             const fullx2 = ctr.x + (cellsize / 2);
        //             const [tlx,,,] = shortenLine(fullx1, ytop, fullx2, ytop, shorten);
        //             const buff = board.rect(w, h).id(`${i},-1`)
        //                 .stroke({color: baseColour, width: baseStroke, opacity: baseOpacity})
        //                 .move(tlx, ytop);
        //             if (fill !== undefined) {
        //                 buff.fill(fill);
        //             } else {
        //                 buff.fill({color: "white", opacity: 0})
        //             }
        //             if (ctx.options.boardClick !== undefined) {
        //                 buff.click((e: MouseEvent) => {
        //                     ctx.options.boardClick!(-1, -1, buff.id());
        //                     e.stopPropagation();
        //                 });
        //             }
        //         }
        //         // always add corner dots
        //         const buffLeft = board.rect(bufferwidth, bufferwidth).id(`-1,-1`)
        //                 .stroke({color: baseColour, width: baseStroke, opacity: baseOpacity})
        //                 .move(grid[0][0].x - (cellsize / 2) - (bufferwidth + offset), grid[0][0].y - (cellsize / 2) - (bufferwidth + offset));
        //         if (fill !== undefined) {
        //             buffLeft.fill(fill);
        //         } else {
        //             buffLeft.fill({color: "white", opacity: 0})
        //         }
        //         if (ctx.options.boardClick !== undefined) {
        //             buffLeft.click((e: MouseEvent) => {
        //                 ctx.options.boardClick!(-1, -1, buffLeft.id());
        //                 e.stopPropagation();
        //             });
        //         }
        //         const buffRight = board.rect(bufferwidth, bufferwidth).id(`${grid[0].length},-1`)
        //                 .stroke({color: baseColour, width: baseStroke, opacity: baseOpacity})
        //                 .move(grid[0][grid[0].length - 1].x + (cellsize / 2) + offset, grid[0][grid[0].length - 1].y - (cellsize / 2) - (bufferwidth + offset));
        //         if (fill !== undefined) {
        //             buffRight.fill(fill);
        //         } else {
        //             buffRight.fill({color: "white", opacity: 0})
        //         }
        //         if (ctx.options.boardClick !== undefined) {
        //             buffRight.click((e: MouseEvent) => {
        //                 ctx.options.boardClick!(-1, -1, buffRight.id());
        //                 e.stopPropagation();
        //             });
        //         }
        //     }
        //     // bottom
        //     if (show.includes("S")) {
        //         const h = bufferwidth;
        //         const w = cellsize * multiple;
        //         for (let i = 0; i < grid[grid.length - 1].length; i++) {
        //             const ctr = grid[grid.length - 1][i];
        //             const ytop = ctr.y + (cellsize / 2) + (offset);
        //             const fullx1 = ctr.x - (cellsize / 2);
        //             const fullx2 = ctr.x + (cellsize / 2);
        //             const [tlx,,,] = shortenLine(fullx1, ytop, fullx2, ytop, shorten);
        //             const buff = board.rect(w, h).id(`${i},${grid.length}`)
        //                 .stroke({color: baseColour, width: baseStroke, opacity: baseOpacity})
        //                 .move(tlx, ytop);
        //             if (fill !== undefined) {
        //                 buff.fill(fill);
        //             } else {
        //                 buff.fill({color: "white", opacity: 0})
        //             }
        //             if (ctx.options.boardClick !== undefined) {
        //                 buff.click((e: MouseEvent) => {
        //                     ctx.options.boardClick!(-1, -1, buff.id());
        //                     e.stopPropagation();
        //                 });
        //             }
        //         }
        //         // always add corner dots
        //         const buffLeft = board.rect(bufferwidth, bufferwidth).id(`-1,${grid.length}`)
        //                 .stroke({color: baseColour, width: baseStroke, opacity: baseOpacity})
        //                 .move(grid[grid.length - 1][0].x - (cellsize / 2) - (bufferwidth + offset), grid[grid.length - 1][0].y + (cellsize / 2) + offset);
        //         if (fill !== undefined) {
        //             buffLeft.fill(fill);
        //         } else {
        //             buffLeft.fill({color: "white", opacity: 0})
        //         }
        //         if (ctx.options.boardClick !== undefined) {
        //             buffLeft.click((e: MouseEvent) => {
        //                 ctx.options.boardClick!(-1, -1, buffLeft.id());
        //                 e.stopPropagation();
        //             });
        //         }
        //         const buffRight = board.rect(bufferwidth, bufferwidth).id(`${grid[grid.length - 1].length},${grid.length}`)
        //                 .stroke({color: baseColour, width: baseStroke, opacity: baseOpacity})
        //                 .move(grid[grid.length - 1][grid[grid.length - 1].length - 1].x + (cellsize / 2) + offset, grid[grid.length - 1][grid[grid.length - 1].length - 1].y + (cellsize / 2) + offset);
        //         if (fill !== undefined) {
        //             buffRight.fill(fill);
        //         } else {
        //             buffRight.fill({color: "white", opacity: 0})
        //         }
        //         if (ctx.options.boardClick !== undefined) {
        //             buffRight.click((e: MouseEvent) => {
        //                 ctx.options.boardClick!(-1, -1, buffRight.id());
        //                 e.stopPropagation();
        //             });
        //         }
        //     }
        //     // left
        //     if (show.includes("W")) {
        //         const w = bufferwidth;
        //         const h = cellsize * multiple;
        //         for (let i = 0; i < grid.length; i++) {
        //             const ctr = grid[i][0];
        //             const xtop = ctr.x - (cellsize / 2) - (w + offset);
        //             const fully1 = ctr.y - (cellsize / 2);
        //             const fully2 = ctr.y + (cellsize / 2);
        //             const [,tly,,] = shortenLine(xtop, fully1, xtop, fully2, shorten);
        //             const buff = board.rect(w, h).id(`-1,${i}`)
        //                 .stroke({color: baseColour, width: baseStroke, opacity: baseOpacity})
        //                 .move(xtop, tly);
        //             if (fill !== undefined) {
        //                 buff.fill(fill);
        //             } else {
        //                 buff.fill({color: "white", opacity: 0})
        //             }
        //             if (ctx.options.boardClick !== undefined) {
        //                 buff.click((e: MouseEvent) => {
        //                     ctx.options.boardClick!(-1, -1, buff.id());
        //                     e.stopPropagation();
        //                 });
        //             }
        //         }
        //         // only add corner dots if not already present
        //         if (!show.includes("S")) {
        //             const buffLeft = board.rect(bufferwidth, bufferwidth).id(`-1,${grid.length}`)
        //                     .stroke({color: baseColour, width: baseStroke, opacity: baseOpacity})
        //                     .move(grid[grid.length - 1][0].x - (cellsize / 2) - (bufferwidth + offset), grid[grid.length - 1][0].y + (cellsize / 2) + offset);
        //             if (fill !== undefined) {
        //                 buffLeft.fill(fill);
        //             } else {
        //                 buffLeft.fill({color: "white", opacity: 0})
        //             }
        //             if (ctx.options.boardClick !== undefined) {
        //                 buffLeft.click((e: MouseEvent) => {
        //                     ctx.options.boardClick!(-1, -1, buffLeft.id());
        //                     e.stopPropagation();
        //                 });
        //             }
        //         }
        //         if (!show.includes("N")) {
        //             const buffRight = board.rect(bufferwidth, bufferwidth).id(`-1,-1`)
        //                     .stroke({color: baseColour, width: baseStroke, opacity: baseOpacity})
        //                     .move(grid[0][0].x - (cellsize / 2) - (bufferwidth + offset), grid[0][0].y - (cellsize / 2) - (bufferwidth + offset));
        //             if (fill !== undefined) {
        //                 buffRight.fill(fill);
        //             } else {
        //                 buffRight.fill({color: "white", opacity: 0})
        //             }
        //             if (ctx.options.boardClick !== undefined) {
        //                 buffRight.click((e: MouseEvent) => {
        //                     ctx.options.boardClick!(-1, -1, buffRight.id());
        //                     e.stopPropagation();
        //                 });
        //             }
        //         }
        //     }
        //     // right
        //     if (show.includes("E")) {
        //         const w = bufferwidth;
        //         const h = cellsize * multiple;
        //         for (let i = 0; i < grid.length; i++) {
        //             const ctr = grid[i][grid[i].length - 1];
        //             const xtop = ctr.x + (cellsize / 2) + (offset);
        //             const fully1 = ctr.y - (cellsize / 2);
        //             const fully2 = ctr.y + (cellsize / 2);
        //             const [,tly,,] = shortenLine(xtop, fully1, xtop, fully2, shorten);
        //             const buff = board.rect(w, h).id(`${grid[i].length},${i}`)
        //                 .stroke({color: baseColour, width: baseStroke, opacity: baseOpacity})
        //                 .move(xtop, tly);
        //             if (fill !== undefined) {
        //                 buff.fill(fill);
        //             } else {
        //                 buff.fill({color: "white", opacity: 0})
        //             }
        //             if (ctx.options.boardClick !== undefined) {
        //                 buff.click((e: MouseEvent) => {
        //                     ctx.options.boardClick!(-1, -1, buff.id());
        //                     e.stopPropagation();
        //                 });
        //             }
        //         }
        //         // only add corner dots if not already present
        //         if (!show.includes("N")) {
        //             const buffLeft = board.rect(bufferwidth, bufferwidth).id(`${grid[0].length},-1`)
        //                     .stroke({color: baseColour, width: baseStroke, opacity: baseOpacity})
        //                     .move(grid[0][grid[0].length - 1].x + (cellsize / 2) + offset, grid[0][grid[0].length - 1].y - (cellsize / 2) - (bufferwidth + offset));
        //             if (fill !== undefined) {
        //                 buffLeft.fill(fill);
        //             } else {
        //                 buffLeft.fill({color: "white", opacity: 0})
        //             }
        //             if (ctx.options.boardClick !== undefined) {
        //                 buffLeft.click((e: MouseEvent) => {
        //                     ctx.options.boardClick!(-1, -1, buffLeft.id());
        //                     e.stopPropagation();
        //                 });
        //             }
        //         }
        //         if (!show.includes("S")) {
        //             const buffRight = board.rect(bufferwidth, bufferwidth).id(`${grid[grid.length - 1].length},${grid.length}`)
        //                     .stroke({color: baseColour, width: baseStroke, opacity: baseOpacity})
        //                     .move(grid[grid.length - 1][grid[grid.length - 1].length - 1].x + (cellsize / 2) + offset, grid[grid.length - 1][grid[grid.length - 1].length - 1].y + (cellsize / 2) + offset);
        //             if (fill !== undefined) {
        //                 buffRight.fill(fill);
        //             } else {
        //                 buffRight.fill({color: "white", opacity: 0})
        //             }
        //             if (ctx.options.boardClick !== undefined) {
        //                 buffRight.click((e: MouseEvent) => {
        //                     ctx.options.boardClick!(-1, -1, buffRight.id());
        //                     e.stopPropagation();
        //                 });
        //             }
        //         }
        //     }
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
        // account for the midpoint letters
        const realWidth = width + (width - 1);
        let columnLabels = ctx.getLabels(customLabels, realWidth);
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
        const minx = Math.min(...grid.flat().map(pt => pt.x));
        const miny = Math.min(...grid.flat().map(pt => pt.y));
        const maxx = Math.max(...grid.flat().map(pt => pt.x));
        const maxy = Math.max(...grid.flat().map(pt => pt.y));
        for (let col = 0; col < realWidth; col++) {
            const wideRow = start === "W" ? 0 : 1;
            const narrowRow = start === "W" ? 1 : 0;
            const xcol = Math.floor(col / 2);
            const xrow = (col % 2 === 0) ? wideRow : narrowRow;
            const pointTop = {x: grid[xrow][xcol].x, y: miny - (cellsize) - (show.includes("N") ? bufferwidth : 0)};
            const pointBottom = {x: grid[xrow][xcol].x, y: maxy + (cellsize) + (show.includes("S") ? bufferwidth : 0)};
            if (! hideHalf) {
                labels.text(columnLabels[col]).fill(labelColour).opacity(labelOpacity).center(pointTop.x, pointTop.y);
            }
            labels.text(columnLabels[col]).fill(labelColour).opacity(labelOpacity).center(pointBottom.x, pointBottom.y);
        }

        // Rows (numbers)
        for (let row = 0; row < height; row++) {
            const pointL = {x: minx - (cellsize) - (show.includes("W") ? bufferwidth : 0), y: grid[row][0].y};
            const pointR = {x: maxx + (cellsize) + (show.includes("E") ? bufferwidth : 0), y: grid[row][0].y};
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

    // Draw grid lines
    for (let row = 0; row < grid.length; row++) {
        const isWide = (start === "W") ? (row % 2 === 0) : (row % 2 === 1);
        const currRow = grid[row];
        for (let col = 0; col < grid[row].length; col++) {
            const curr = currRow[col];
            const isBlocked = blocked?.find(b => b.row === row && b.col === col);
            if (isBlocked !== undefined) {
                continue;
            }
            // always connect to cell to the left
            if (col > 0) {
                // skip if blocked
                const found = blocked?.find(b => b.row === row && b.col === col - 1);
                if (found === undefined) {
                    const prev = currRow[col - 1];
                    const x1 = curr.x;
                    const y1 = curr.y;
                    const x2 = prev.x;
                    const y2 = prev.y;
                    gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"});
                }
            }

            // connections are built upward, so only continue with rows after the first
            if (row > 0) {
                // wide rows connect directly above and one to the left if possible
                // wide rows also connect to the outer point two rows up, if possible
                if (isWide) {
                    // directly above possible for every point except the last
                    if (col < width - 1) {
                        // skip if blocked
                        const found = blocked?.find(b => b.row === row - 1 && b.col === col);
                        if (found === undefined) {
                            const prev = grid[row - 1][col];
                            const x1 = curr.x;
                            const y1 = curr.y;
                            const x2 = prev.x;
                            const y2 = prev.y;
                            gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"});
                        }
                    }
                    // above and to the left good for all but the first
                    if (col > 0) {
                        // skip if blocked
                        const found = blocked?.find(b => b.row === row - 1 && b.col === col - 1);
                        if (found === undefined) {
                            const prev = grid[row - 1][col - 1];
                            const x1 = curr.x;
                            const y1 = curr.y;
                            const x2 = prev.x;
                            const y2 = prev.y;
                            gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"});
                        }
                    }
                    // two above if outer point and possible
                    // but ignore if `no-borders` is set
                    if ((ctx.json.options === undefined || !ctx.json.options.includes("no-border"))) {
                        if ( (col === 0 || col === grid[row].length - 1) && (row > 1)) {
                            // skip if blocked
                            const found = blocked?.find(b => b.row === row - 2 && b.col === col);
                            if (found === undefined) {
                                const prev = grid[row - 2][col];
                                const x1 = curr.x;
                                const y1 = curr.y;
                                const x2 = prev.x;
                                const y2 = prev.y;
                                gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"});
                            }
                        }
                    }
                }
                // narrow rows connect directly above and one to the right
                else {
                    // directly above always possible
                    // skip if blocked
                    let found = blocked?.find(b => b.row === row - 1 && b.col === col);
                    if (found === undefined) {
                        const prev = grid[row - 1][col];
                        const x1 = curr.x;
                        const y1 = curr.y;
                        const x2 = prev.x;
                        const y2 = prev.y;
                        gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"});
                    }
                    // above and to the right always possible
                    // skip if blocked
                    found = blocked?.find(b => b.row === row - 1 && b.col === col + 1);
                    if (found === undefined) {
                        const prev = grid[row - 1][col + 1];
                        const x1 = curr.x;
                        const y1 = curr.y;
                        const x2 = prev.x;
                        const y2 = prev.y;
                        gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"});
                    }
                }
            }
        }
    }

    if (ctx.options.boardClick !== undefined) {
        // moving to click catchers across the board to make arbitrary rotation easier
        // const tiles = board.group().id("tiles");
        const tile = ctx.rootSvg.defs().rect(ctx.cellsize, ctx.cellsize).fill(ctx.options.colourContext.background).opacity(0).id("_clickCatcher");
        for (let row = 0; row < grid.length; row++) {
            for (let col = 0; col < grid[row].length; col++) {
                const found = blocked?.find(b => b.row === row && b.col === col);
                if (found !== undefined) {
                    continue;
                }
                const {x, y} = grid[row][col];
                const t = tiles.use(tile).dmove(x - (cellsize / 2), y - (cellsize / 2));
                t.click(() => ctx.options.boardClick!(row, col, ""));
            }
        }
    }

    ctx.markBoard({svgGroup: gridlines, preGridLines: false, grid});

    return grid;
}
