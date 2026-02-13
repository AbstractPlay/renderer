import { Element as SVGElement } from "@svgdotjs/svg.js";
import { GridPoints, IPoint, rectOfRects } from "../grids";
import { MarkerOutline } from "../schemas/schema";
import { RendererBase } from "../renderers/_base";

export const sowing = (ctx: RendererBase): GridPoints => {
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
    let endpits = true;
    if ( ("showEndPits" in ctx.json.board) && (ctx.json.board.showEndPits === false) )  {
        endpits = false;
    }
    let squarePits: {row: number; col: number}[] = [];
    if ( ("squarePits" in ctx.json.board) && (ctx.json.board.squarePits !== undefined) && (Array.isArray(ctx.json.board.squarePits)) )  {
        squarePits = ctx.json.board.squarePits as [{row: number; col: number}, ...{row: number; col: number}[]];
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
    const grid = rectOfRects({gridHeight: height, gridWidth: width, cellSize: cellsize});
    const board = ctx.rootSvg.group().id("board");

    // Make an expanded grid for markers, to accommodate edge marking and shading
    // Add one row and one column and shift all points up and to the left by half a cell size
    let gridExpanded = rectOfRects({gridHeight: height + 1, gridWidth: width + 1, cellSize: cellsize});
    gridExpanded = gridExpanded.map((row) => row.map((cell) => ({x: cell.x - (cellsize / 2), y: cell.y - (cellsize / 2)} as IPoint)));

    // add endpits to the grid if present (after it's expanded)
    if (endpits) {
        const {x: lx, y: ly} = grid[0][0];
        const {x: rx, y: ry} = grid[0][width - 1];
        const lst: IPoint[] = [];
        // left
        lst.push({x: lx - cellsize, y: ly + (cellsize / 2)});
        // right
        lst.push({x: rx + cellsize, y: ry + (cellsize / 2)});
        grid.push(lst);
    }

    const gridlines = board.group().id("gridlines");
    ctx.markBoard({svgGroup: gridlines, preGridLines: true, grid, gridExpanded});

    const shrinkage = 0.75;
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
        const labels = board.group().id("labels");
        let customLabels: string[]|undefined;
        if ( ("columnLabels" in ctx.json.board) && (ctx.json.board.columnLabels !== undefined) ) {
            customLabels = ctx.json.board.columnLabels;
        }
        const columnLabels = ctx.getLabels(customLabels, width);
        if ( (ctx.json.options !== undefined) && (ctx.json.options.includes("reverse-letters")) ) {
            columnLabels.reverse();
        }

        // Columns (letters)
        for (let col = 0; col < width; col++) {
            const pointTop = {x: grid[0][col].x, y: grid[0][col].y - cellsize};
            const pointBottom = {x: grid[height - 1][col].x, y: grid[height - 1][col].y + cellsize};
            labels.text(columnLabels[col]).fill(labelColour).opacity(labelOpacity).center(pointTop.x, pointTop.y);
            labels.text(columnLabels[col]).fill(labelColour).opacity(labelOpacity).center(pointBottom.x, pointBottom.y);
        }

        // Rows (numbers)
        const rowLabels = ctx.getRowLabels(ctx.json.board.rowLabels, height);
        if ( (ctx.json.options !== undefined) && (ctx.json.options.includes("reverse-numbers")) ) {
            rowLabels.reverse();
        }

        for (let row = 0; row < height; row++) {
            const pointL = {x: grid[row][0].x - cellsize, y: grid[row][0].y};
            const pointR = {x: grid[row][width - 1].x + cellsize, y: grid[row][width - 1].y};
            if (endpits) {
                pointL.x -= cellsize * shrinkage;
                pointR.x += cellsize * shrinkage;
            }
            labels.text(rowLabels[row]).fill(labelColour).opacity(labelOpacity).center(pointL.x, pointL.y);
            labels.text(rowLabels[row]).fill(labelColour).opacity(labelOpacity).center(pointR.x, pointR.y);
        }
    }

    // Now the tiles
    type Blocked = [{row: number;col: number;},...{row: number;col: number;}[]];
    let blocked: Blocked|undefined;
    if ( (ctx.json.board.blocked !== undefined) && (ctx.json.board.blocked !== null)  && (Array.isArray(ctx.json.board.blocked)) && (ctx.json.board.blocked.length > 0) ){
        blocked = [...(ctx.json.board.blocked as Blocked)];
    }

    // // need to create reversed points now for the square pits to be placed correctly
    // let reversed: GridPoints = [...grid.map(l => [...l])];
    // if (ctx.options.rotate === 180) {
    //     // The grid however, if there are end pits, we need to hold the
    //     // last row aside and reinsert it after reversing.
    //     let holding: IPoint[]|undefined;
    //     if (endpits) {
    //         holding = grid.splice(-1, 1)[0];
    //     }
    //     reversed = reversed.map((r) => r.reverse()).reverse();
    //     if (holding !== undefined) {
    //         reversed.push(holding.reverse());
    //     }
    // }

    const tilePit = ctx.rootSvg.defs().symbol().id("pit-symbol").viewbox(0, 0, cellsize, cellsize);
    tilePit.circle(cellsize * shrinkage)
        .center(cellsize / 2, cellsize / 2)
        .fill({color: ctx.options.colourContext.background, opacity: 0})
        .stroke({width: baseStroke, color: baseColour, opacity: baseOpacity})
        .attr("data-outlined", true)
    const tileSquare = ctx.rootSvg.defs().symbol().id("square-pit-symbol").viewbox(0, 0, cellsize, cellsize);
    tileSquare.rect(cellsize * shrinkage, cellsize * shrinkage)
        .center(cellsize / 2, cellsize / 2)
        .fill({color: ctx.options.colourContext.background, opacity: 0})
        .stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"})
        .attr("data-outlined", true)
    const tileEnd = ctx.rootSvg.defs().symbol().id("end-pit-symbol").viewbox(0, 0, cellsize, cellsize * height);
    tileEnd.rect(cellsize * shrinkage, cellsize * height * 0.95)
        .radius(10)
        .center(cellsize / 2, (cellsize * height) / 2)
        .fill({color: ctx.options.colourContext.background, opacity: 0})
        .stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"})
        .attr("data-outlined", true)

    // check for cells with `outline` marker
    let outlines: MarkerOutline[] = [];
    if ( ("markers" in ctx.json.board) && (ctx.json.board.markers !== undefined) ) {
        outlines = ctx.json.board.markers.filter(m => m.type === "outline") as MarkerOutline[];
    }

    const tiles = board.group().id("tiles");
    // Place them
    for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
            const outlined = outlines.find(o => o.points.find(p => p.col === col && p.row === row) !== undefined);

            // skip blocked cells
            if ( (blocked !== undefined) && (blocked.find(o => o.row === row && o.col === col) !== undefined) ) {
                continue;
            }
            let tile = tilePit;
            let isSquare = false;
            if (squarePits.find(o => o.row === row && o.col === col) !== undefined) {
                tile = tileSquare;
                isSquare = true;
            }
            if (outlined !== undefined) {
                const outWidth = baseStroke;
                let outColor = baseColour;
                let outOpacity = baseOpacity;
                if (outlined.colour !== undefined) {
                    outColor = ctx.resolveColour(outlined.colour) as string;
                }
                if (outlined.opacity !== undefined) {
                    outOpacity = outlined.opacity;
                }
                tile = tile.clone().id(`tile-${isSquare ? "square-" : ""}outlined-${outColor}`);
                tile.find("[data-outlined=true]").each(function(this: SVGElement) { this.stroke({width: outWidth, color: outColor, opacity: outOpacity}); });
                ctx.rootSvg.defs().add(tile);
            }

            const pxrow = row;
            const pxcol = col;
            const {x, y} = grid[pxrow][pxcol];
            const used = tiles.use(tile).size(cellsize, cellsize).center(x, y);
            if (ctx.options.boardClick !== undefined) {
                used.click(() => ctx.options.boardClick!(row, col, ""));
            }
        }
    }
    // place end pits if appropriate
    if (endpits) {
        // lefthand
        let {x, y} = grid[0][0];
        let tileToUse = tileEnd;
        const leftCol = 0;
        let outlined = outlines.find(o => o.points.find(p => p.col === leftCol && p.row === height) !== undefined);
        if (outlined !== undefined) {
            const outWidth = baseStroke;
            let outColor = baseColour;
            let outOpacity = baseOpacity;
            if (outlined.colour !== undefined) {
                outColor = ctx.resolveColour(outlined.colour) as string;
            }
            if (outlined.opacity !== undefined) {
                outOpacity = outlined.opacity;
            }
            tileToUse = tileEnd.clone().id(`tile-end-outlined-${outColor}`);
            tileToUse.find("[data-outlined=true]").each(function(this: SVGElement) { this.stroke({width: outWidth, color: outColor, opacity: outOpacity}); });
            ctx.rootSvg.defs().add(tileToUse);
        }
        const left = tiles.use(tileToUse).size(cellsize, cellsize * height).move(x - (cellsize * 1.5), y - (cellsize / 2));
        if (ctx.options.boardClick !== undefined) {
            const name = "_east";
            left.click(() => ctx.options.boardClick!(-1, -1, name));
        }

        // righthand
        ({x, y} = grid[0][width - 1]);
        tileToUse = tileEnd;
        const rightCol = 1;
        outlined = outlines.find(o => o.points.find(p => p.col === rightCol && p.row === height) !== undefined);
        if (outlined !== undefined) {
            const outWidth = baseStroke;
            let outColor = baseColour;
            let outOpacity = baseOpacity;
            if (outlined.colour !== undefined) {
                outColor = ctx.resolveColour(outlined.colour) as string;
            }
            if (outlined.opacity !== undefined) {
                outOpacity = outlined.opacity;
            }
            tileToUse = tileEnd.clone().id(`tile-end-outlined-${outColor}`);
            tileToUse.find("[data-outlined=true]").each(function(this: SVGElement) { this.stroke({width: outWidth, color: outColor, opacity: outOpacity}); });
            ctx.rootSvg.defs().add(tileToUse);
        }
        const right = tiles.use(tileToUse).size(cellsize, cellsize * height).move(x + (cellsize / 2), y - (cellsize / 2));
        if (ctx.options.boardClick !== undefined) {
            const name = "_west";
            right.click(() => ctx.options.boardClick!(-1, -1, name));
        }
    }

    // Draw exterior grid lines
    // Draw square around entire board
    gridlines.rect(width * cellsize, height * cellsize)
        .move(0 - (cellsize / 2), 0 - (cellsize / 2))
        .fill({color: ctx.options.colourContext.background, opacity: 0})
        .stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"});
    // if even number of rows, draw line between the halves
    if (height % 2 === 0) {
        const x1 = 0 - (cellsize / 2);
        const y1 = x1 + ((height * cellsize) / 2);
        const x2 = x1 + (width * cellsize);
        const y2 = y1;
        gridlines.line(x1, y1, x2, y2)
            .stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"});
    }

    ctx.markBoard({svgGroup: gridlines, preGridLines: false, grid, gridExpanded});

    return grid;
}
