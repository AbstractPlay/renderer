import { Element as SVGElement, Rect as SVGRect, StrokeData, Symbol as SVGSymbol, Use as SVGUse } from "@svgdotjs/svg.js";
import { GridPoints, IPoint, IPolyPolygon, Poly, rectOfRects } from "../grids";
import { RendererBase } from "../renderers/_base";
import { rotatePoint, shortenLine } from "../common/plotting";
import tinycolor from "tinycolor2";
import { MarkerOutline } from "../schemas/schema";
import { CompassDirection, IBuffer } from ".";

export const squares = (ctx: RendererBase, opts?: {noSvg: boolean}): [GridPoints, Poly[][]] => {
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

    let clickEdges = false;
    if ( (ctx.json.options !== undefined) && (ctx.json.options.includes("clickable-edges")) ) {
        clickEdges = (ctx.options.boardClick !== undefined);
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

    // create polys for flood fills and other potential uses
    const polys: IPolyPolygon[][] = [];
    for (let y = 0; y < height; y++) {
        const rowPolys: IPolyPolygon[] = [];
        for (let x = 0; x < width; x++) {
            const {x: cx, y: cy} = grid[y][x];
            const half = cellsize / 2;
            const node: IPoint[] = [
                {x: cx - half, y: cy - half},
                {x: cx + half, y: cy - half},
                {x: cx + half, y: cy + half},
                {x: cx - half, y: cy + half},
            ];
            rowPolys.push({
                type: "poly",
                points: node,
            });
        }
        polys.push(rowPolys);
    }
    if (opts !== undefined && opts.noSvg === true) {
        return [grid, polys];
    }

    const board = ctx.rootSvg.group().id("board");

    // Make an expanded grid for markers, to accommodate edge marking and shading
    // Add one row and one column and shift all points up and to the left by half a cell size
    let gridExpanded = rectOfRects({gridHeight: height + 1, gridWidth: width + 1, cellSize: cellsize});
    gridExpanded = gridExpanded.map((row) => row.map((cell) => ({x: cell.x - (cellsize / 2), y: cell.y - (cellsize / 2)} as IPoint)));

    // define "tiles" earlier so clickable gridlines are viable
    const tiles = board.group().id("tiles");
    const gridlines = board.group().id("gridlines");
    ctx.markBoard({svgGroup: gridlines, preGridLines: true, grid, gridExpanded, polys});

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
        const offset = cellsize * 0.1;

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
                            ctx.options.boardClick!(-1, -1, buff.id());
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
            const pointTop = {x: grid[0][col].x, y: grid[0][col].y - cellsize - (show.includes("N") ? bufferwidth : 0)};
            const pointBottom = {x: grid[height - 1][col].x, y: grid[height - 1][col].y + cellsize + (show.includes("S") ? bufferwidth : 0)};
            if (! hideHalf) {
                labels.text(columnLabels[col]).fill(labelColour).opacity(labelOpacity).center(pointTop.x, pointTop.y);
            }
            labels.text(columnLabels[col]).fill(labelColour).opacity(labelOpacity).center(pointBottom.x, pointBottom.y);
        }

        // Rows (numbers)
        for (let row = 0; row < height; row++) {
            const pointL = {x: grid[row][0].x - cellsize - (show.includes("W") ? bufferwidth : 0), y: grid[row][0].y};
            const pointR = {x: grid[row][width - 1].x + cellsize + (show.includes("E") ? bufferwidth : 0), y: grid[row][width - 1].y};
            labels.text(rowLabels[row]).fill(labelColour).opacity(labelOpacity).center(pointL.x, pointL.y);
            if (! hideHalf) {
                labels.text(rowLabels[row]).fill(labelColour).opacity(labelOpacity).center(pointR.x, pointR.y);
            }
        }
    }

    // Now the tiles
    type Blocked = [{row: number;col: number;},...{row: number;col: number;}[]];
    let blocked: Blocked|undefined;
    if ( (ctx.json.board.blocked !== undefined) && (ctx.json.board.blocked !== null)  && (Array.isArray(ctx.json.board.blocked)) && (ctx.json.board.blocked.length > 0) ){
        blocked = [...(ctx.json.board.blocked as Blocked)];
    }

    if (style === "squares-checkered") {
        // Load glyphs for light and dark squares
        const cBg = tinycolor(ctx.options.colourContext.background);
        const cFill = tinycolor(ctx.options.colourContext.fill);
        // If the background colour is lighter than the fill colour, then light tiles are fully transparent, and dark tiles are 75% transparent.
        let tileDark: SVGSymbol;
        let tileLight: SVGSymbol;
        if (cBg.getLuminance() > cFill.getLuminance()) {
            tileLight = ctx.rootSvg.defs().symbol().id("tile-light").viewbox(0, 0, cellsize, cellsize);
            tileLight.rect(cellsize, cellsize)
                .move(0, 0)
                .fill({color: ctx.options.colourContext.background})
                .opacity(0)
                .stroke({width: 0});
            tileDark = ctx.rootSvg.defs().symbol().id("tile-dark").viewbox(0, 0, cellsize, cellsize);
            tileDark.rect(cellsize, cellsize)
                .move(0, 0)
                .fill(ctx.options.colourContext.fill)
                .opacity(baseOpacity * 0.25)
                .stroke({width: 0});
        // If the background colour is darker than the fill colour (dark mode), then light tiles are 75% transparent and dark tiles are fully transparent.
        } else {
            tileLight = ctx.rootSvg.defs().symbol().id("tile-light").viewbox(0, 0, cellsize, cellsize);
            tileLight.rect(cellsize, cellsize)
                .move(0, 0)
                .fill({color: ctx.options.colourContext.fill})
                .opacity(baseOpacity * 0.25)
                .stroke({width: 0});
            tileDark = ctx.rootSvg.defs().symbol().id("tile-dark").viewbox(0, 0, cellsize, cellsize);
            tileDark.rect(cellsize, cellsize)
                .move(0, 0)
                .fill(ctx.options.colourContext.background)
                .opacity(0)
                .stroke({width: 0});
        }
        // const tileBlocked = ctx.rootSvg.defs().symbol().id("tile-blocked").viewbox(0, 0, cellsize, cellsize);
        // tileBlocked.rect(cellsize, cellsize)
        //     .move(0, 0)
        //     .fill({color: ctx.options.colourContext.fill, opacity: baseOpacity})
        //     .stroke({width: 0});

        // Determine whether the first row starts with a light or dark square
        let startLight = 1;
        if (height % 2 === 0) {
            startLight = 0;
        }
        if ( ("startLight" in ctx.json.board) ) {
            if (ctx.json.board.startLight) {
                startLight = 0;
            } else {
                startLight = 1;
            }
        }

        // Place them
        for (let row = 0; row < height; row++) {
            let lightCol = 1;
            if (row % 2 === startLight) {
                lightCol = 0;
            }
            for (let col = 0; col < width; col++) {
                let idx = -1;
                if (blocked !== undefined) {
                    idx = blocked.findIndex(o => o.row === row && o.col === col)
                }
                const {x, y} = grid[row][col];
                let used: SVGUse;
                if (idx !== -1) {
                    // used = tiles.use(tileBlocked).size(cellsize, cellsize).center(x, y);
                } else {
                    if (col % 2 !== lightCol) {
                        used = tiles.use(tileDark).size(cellsize, cellsize).center(x, y);
                    } else {
                        used = tiles.use(tileLight).size(cellsize, cellsize).center(x, y);
                    }
                    if (tileSpace > 0) {
                        used.click(() => ctx.options.boardClick!(row, col, ""));
                    }
                }
            }
        }
    } else if (tileSpace > 0 || style === "pegboard" ) {
        const tileLight = ctx.rootSvg.defs().symbol().id("tile-light").viewbox(0, 0, cellsize, cellsize);
        tileLight.rect(cellsize, cellsize)
            .fill({color: ctx.options.colourContext.background, opacity: 0})
            .stroke({width: 0});
        if (style === "pegboard") {
            tileLight.circle(cellsize / 5)
                .stroke({width: baseStroke, color: baseColour, opacity: baseOpacity})
                .fill({color: baseColour, opacity: baseOpacity})
                .center(cellsize / 2, cellsize / 2);
        }
        const tileBlocked = ctx.rootSvg.defs().symbol().id("tile-blocked").viewbox(0, 0, cellsize, cellsize);
        if (style === "pegboard") {
            tileBlocked.rect(cellsize, cellsize)
                .fill({color: ctx.options.colourContext.background, opacity: 0})
                .stroke({width: 0});
        } else {
            // tileBlocked.rect(cellsize, cellsize)
            //     .move(0, 0)
            //     .fill({color: baseColour, opacity: baseOpacity})
            //     .stroke({width: 0});
        }

        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                let idx = -1;
                if (blocked !== undefined) {
                    idx = blocked.findIndex(o => o.row === row && o.col === col)
                }
                const {x, y} = grid[row][col];
                let used: SVGUse;
                if (idx !== -1) {
                    used = tiles.use(tileBlocked).size(cellsize, cellsize).center(x, y);
                } else {
                    used = tiles.use(tileLight).size(cellsize, cellsize).center(x, y);
                    used.click(() => ctx.options.boardClick!(row, col, ""));
                }
            }
        }
    } else if (blocked !== undefined) {
        // const tileBlocked = ctx.rootSvg.defs().symbol().id("tile-blocked").viewbox(0, 0, cellsize, cellsize);
        // tileBlocked.rect(cellsize, cellsize)
        //     .move(0, 0)
        //     .fill({color: ctx.options.colourContext.fill, opacity: baseOpacity})
        //     .stroke({width: 0});
        // for (const coord of blocked) {
        //     const {x, y} = grid[coord.row][coord.col];
        //     tiles.use(tileBlocked).size(cellsize, cellsize).center(x, y);
        // }
    }

    // Draw grid lines
    if (style !== "pegboard") {
        if (style === "squares-beveled") {
            baseOpacity *= 0.15;
        }

        // for each unblocked grid node, create a line for each edge
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let idx = -1;
                if (blocked !== undefined) {
                    idx = blocked.findIndex(b => b.col === x && b.row === y);
                }
                if (idx === -1) {
                    const {x: cx, y: cy} = grid[y][x];
                    const half = cellsize / 2;
                    const pts: IPoint[] = [
                        {x: cx - half, y: cy - half},
                        {x: cx + half, y: cy - half},
                        {x: cx + half, y: cy + half},
                        {x: cx - half, y: cy + half},
                    ];
                    // have to close the poly
                    pts.push(pts[0]);
                    gridlines.polyline(pts.map(pt => [pt.x, pt.y]).flat())
                                .fill("none")
                                .stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"});
                }
            }
        }

        // check for non-spaced tiling and draw thicker lines
        if (tileSpace === 0 && (tilex > 0 || tiley > 0)) {
            if (tiley > 0) {
                // horizontal
                const xLeft = grid[0][0].x - (cellsize / 2);
                const xRight = grid[0][grid[0].length - 1].x + (cellsize / 2);
                for (let row = 0; row < height-1; row++) {
                    if ((row+1) % tiley === 0) {
                        const y = grid[row][0].y + (cellsize / 2);
                        gridlines.line(xLeft, y, xRight, y).stroke({width: baseStroke * tileMult, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"});
                    }
                }
            }
            if (tilex > 0) {
                // vertical
                const yTop = grid[0][0].y - (cellsize / 2);
                const yBottom = grid[grid.length - 1][0].y + (cellsize / 2);
                for (let col = 0; col < width-1; col++) {
                    if ((col+1) % tilex === 0) {
                        const x = grid[0][col].x + (cellsize / 2);
                        gridlines.line(x, yTop, x, yBottom).stroke({width: baseStroke * tileMult, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"});
                    }
                }
            }
        }
    }

    // after gridlines, look for `outline` markers and draw those
    let outlines: MarkerOutline[] = [];
    if ( ("markers" in ctx.json.board) && (ctx.json.board.markers !== undefined) ) {
        outlines = ctx.json.board.markers.filter(m => m.type === "outline") as MarkerOutline[];
    }
    for (const mark of outlines) {
        const colour = ctx.resolveColour(mark.colour) as string;
        let dasharray: string|undefined;
        if (mark.dasharray !== undefined && mark.dasharray !== null && Array.isArray(mark.dasharray)) {
            dasharray = mark.dasharray.join(" ");
        }
        const stroke: StrokeData = {
            color: colour,
            width: ctx.cellsize * 0.05,
            dasharray,
            linecap: "round",
            linejoin: "round",
        };
        for (const cell of mark.points) {
            const poly = polys[cell.row][cell.col];
            gridlines.polygon(poly.points.map(pt => `${pt.x},${pt.y}`).join(" "))
                        .fill("none")
                        .stroke(stroke)
                        .attr({ 'pointer-events': 'none' });
        }
    }

    if ( (ctx.options.boardClick !== undefined) && (tileSpace === 0) && (style !== "pegboard") ) {
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
    }

    // Add edge click handlers if requested
    // All cells have E and S edges. Only first row and column have N and W.
    if (clickEdges) {
        for (let row = 0; row < grid.length; row++) {
            for (let col = 0; col < grid[row].length; col++) {
                const dirs: CompassDirection[] = ["E","S"];
                if (row === 0) {
                    dirs.push("N");
                }
                if (col === 0) {
                    dirs.push("W");
                }
                for (const dir of dirs) {
                    // draw line
                    let x1: number; let y1: number;
                    let x2: number; let y2: number;
                    const halfcell = ctx.cellsize / 2;
                    switch (dir) {
                        case "N":
                            x1 = grid[row][col].x - halfcell;
                            y1 = grid[row][col].y - halfcell;
                            x2 = grid[row][col].x + halfcell;
                            y2 = y1;
                            break;
                        case "S":
                            x1 = grid[row][col].x - halfcell;
                            y1 = grid[row][col].y + halfcell;
                            x2 = grid[row][col].x + halfcell;
                            y2 = y1;
                            break;
                        case "E":
                            x1 = grid[row][col].x + halfcell;
                            y1 = grid[row][col].y - halfcell;
                            x2 = x1;
                            y2 = grid[row][col].y + halfcell;
                            break;
                        case "W":
                            x1 = grid[row][col].x - halfcell;
                            y1 = grid[row][col].y - halfcell;
                            x2 = x1;
                            y2 = grid[row][col].y + halfcell;
                            break;
                        default:
                            throw new Error(`Invalid direction passed: ${dir}`);
                    }
                    const edgeLine = board.line(x1, y1, x2, y2).stroke({ width: baseStroke * 5, color: baseColour, opacity: 0, linecap: "round" });
                    edgeLine.click((e: MouseEvent) => {
                        ctx.options.boardClick!(row, col, dir);
                        e.stopPropagation();
                    });
                }
            }
        }
    }

    ctx.markBoard({svgGroup: gridlines, preGridLines: false, grid, gridExpanded, polys});

    return [grid, polys];
}
