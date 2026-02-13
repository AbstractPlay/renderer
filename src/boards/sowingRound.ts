import { Element as SVGElement } from "@svgdotjs/svg.js";
import { GridPoints, mancalaRound } from "../grids";
import { RendererBase } from "../renderers/_base";
import { MarkerOutline } from "../schemas/schema";

export const sowingRound = (ctx: RendererBase): GridPoints => {
    if ( (ctx.json === undefined) || (ctx.rootSvg === undefined) ) {
        throw new Error("Object in an invalid state!");
    }

    // Check required properties
    if ( (ctx.json.board === null) || (! ("width" in ctx.json.board)) || (ctx.json.board.width === undefined) ) {
        throw new Error("The `width` property is required for this board type.");
    }
    if ( (! ("style" in ctx.json.board)) || (ctx.json.board.style === undefined) ) {
        throw new Error("This function requires that a board style be defined.");
    }

    const width: number = ctx.json.board.width;
    // height is always 1 more for board labels
    let height = 2;
    if ("height" in ctx.json.board && ctx.json.board.height !== undefined) {
        height = ctx.json.board.height + 1;
    }
    const cellsize = ctx.cellsize * 1.25;

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
    const grid = mancalaRound({gridHeight: height, gridWidth: width, cellWidth: cellsize, cellHeight: cellsize * 1.5});
    const board = ctx.rootSvg.group().id("board");

    const gridlines = board.group().id("gridlines");
    ctx.markBoard({svgGroup: gridlines, preGridLines: true, grid});

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
            const pointTop = {x: grid[grid.length - 1][col].x, y: grid[grid.length - 1][col].y};
            labels.text(columnLabels[col]).fill(labelColour).opacity(labelOpacity).center(pointTop.x, pointTop.y);
        }
    }

    // Now the tiles
    type Blocked = [{row: number;col: number;},...{row: number;col: number;}[]];
    let blocked: Blocked|undefined;
    if ( (ctx.json.board.blocked !== undefined) && (ctx.json.board.blocked !== null)  && (Array.isArray(ctx.json.board.blocked)) && (ctx.json.board.blocked.length > 0) ){
        blocked = [...(ctx.json.board.blocked as Blocked)];
    }

    const tilePit = ctx.rootSvg.defs().symbol().id("pit-symbol").viewbox(0, 0, cellsize, cellsize);
    tilePit.circle(cellsize * 0.85)
        .center(cellsize / 2, cellsize / 2)
        .fill({color: ctx.options.colourContext.background, opacity: 0})
        .stroke({width: baseStroke, color: baseColour, opacity: baseOpacity})
        .attr("data-outlined", true)

    // check for cells with `outline` marker
    let outlines: MarkerOutline[] = [];
    if ( ("markers" in ctx.json.board) && (ctx.json.board.markers !== undefined) ) {
        outlines = ctx.json.board.markers.filter(m => m.type === "outline") as MarkerOutline[];
    }

    const tiles = board.group().id("tiles");
    // Place them (subtract 1 from height to account for labels)
    for (let row = 0; row < height - 1; row++) {
        for (let col = 0; col < width; col++) {
            const outlined = outlines.find(o => o.points.find(p => p.col === col && p.row === row) !== undefined);

            // skip blocked cells
            if ( (blocked !== undefined) && (blocked.find(o => o.row === row && o.col === col) !== undefined) ) {
                continue;
            }
            let tile = tilePit;
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
                tile = tile.clone().id(`tile-outlined-${outColor}`);
                tile.find("[data-outlined=true]").each(function(this: SVGElement) { this.stroke({width: outWidth, color: outColor, opacity: outOpacity}); });
                ctx.rootSvg.defs().add(tile);
            }

            const {x, y} = grid[row][col];
            const used = tiles.use(tile).size(cellsize, cellsize).center(x, y);
            if (ctx.options.boardClick !== undefined) {
                used.click(() => ctx.options.boardClick!(row, col, ""));
            }
        }
    }

    ctx.markBoard({svgGroup: gridlines, preGridLines: false, grid});

    return grid;
}
