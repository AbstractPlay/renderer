import { GridPoints, pentagonal as pentagonalGrid } from "../grids";
import { RendererBase } from "../renderers/_base";
import { ptDistance, rotatePoint } from "../common/plotting";
import { pentagonalBoard } from "../common/pentagons";
import { Pentagonal, PentagonalNodeData } from "../graphs";

export const pentagonal = (ctx: RendererBase): GridPoints => {
    if ( (ctx.json === undefined) || (ctx.rootSvg === undefined) ) {
        throw new Error("Object in an invalid state!");
    }

    // Check required properties
    let boardsize: number|undefined;
    if ( (ctx.json.board === null) || ( (! ("width" in ctx.json.board)) && (! ("height" in ctx.json.board)) ) || ( (ctx.json.board.width === undefined) && (ctx.json.board.height === undefined) ) ) {
        throw new Error("Either the `width` or `height` property must be set for this board type.");
    }
    if ( ("width" in ctx.json.board) && ctx.json.board.width !== undefined ) {
        boardsize = ctx.json.board.width;
    } else if ( ("height" in ctx.json.board) && ctx.json.board.height !== undefined ) {
        boardsize = ctx.json.board.height;
    } else {
        throw new Error("Either the `width` or `height` property must be set for this board type.");
    }
    if ( (! ("style" in ctx.json.board)) || (ctx.json.board.style === undefined) ) {
        throw new Error("This function requires that a board style be defined.");
    }
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

    // Get a grid of points
    const g = pentagonalBoard(boardsize);
    const grid = pentagonalGrid({pentagonalGraph: g});
    const graph = new Pentagonal(g);
    const board = ctx.rootSvg.group().id("board");

    // Adjust base graph for Bluestone games
    if (style === "pentagonal-bluestone") {
        // delete any verts/edges relating to the tips
        const toDel = new Set<number>();
        const layer = g.layers[g.layers.length - 1];
        for (const side of layer) {
            toDel.add(side[0].id);
            toDel.add(side[side.length - 1].id);
        }
        for (const vid of toDel) {
            const found = graph.graph.findNode((key, attr) => (attr as PentagonalNodeData).id === vid);
            if (found === undefined) {
                throw new Error(`Could not find a tip point to delete.`);
            }
            graph.graph.dropNode(found);
        }

        // delete all edges between outer nodes
        for (const entry of graph.graph.edgeEntries()) {
            if ((entry.sourceAttributes as PentagonalNodeData).isOuter && (entry.targetAttributes as PentagonalNodeData).isOuter) {
                graph.graph.dropEdge(entry.edge);
            }
        }
    }

    const gridlines = board.group().id("gridlines");
    ctx.markBoard({svgGroup: gridlines, preGridLines: true, grid});

    // Add board labels (skipping for now)
    // let labelColour = ctx.options.colourContext.labels;
    // if ( ("labelColour" in ctx.json.board) && (ctx.json.board.labelColour !== undefined) ) {
    //     labelColour = ctx.resolveColour(ctx.json.board.labelColour) as string;
    // }
    // let labelOpacity = 1;
    // if ( ("labelOpacity" in ctx.json.board) && (ctx.json.board.labelOpacity !== undefined) ) {
    //     labelOpacity = ctx.json.board.labelOpacity;
    // }
    // if ( (! ctx.json.options) || (! ctx.json.options.includes("hide-labels") ) ) {
    //     let hideHalf = false;
    //     if (ctx.json.options?.includes("hide-labels-half")) {
    //         hideHalf = true;
    //     }
    //     const labels = board.group().id("labels");
    //     let customLabels: string[]|undefined;
    //     if ( ("columnLabels" in ctx.json.board) && (ctx.json.board.columnLabels !== undefined) ) {
    //         customLabels = ctx.json.board.columnLabels;
    //     }
    //     let columnLabels = ctx.getLabels(customLabels, width);
    //     if ( (ctx.json.options !== undefined) && (ctx.json.options.includes("reverse-letters")) ) {
    //         columnLabels.reverse();
    //     }

    //     let rowLabels = ctx.getRowLabels(ctx.json.board.rowLabels, height);
    //     if ( (ctx.json.options !== undefined) && (ctx.json.options.includes("reverse-numbers")) ) {
    //         rowLabels.reverse();
    //     }

    //     if (ctx.json.options?.includes("swap-labels")) {
    //         const scratch = [...columnLabels];
    //         columnLabels = [...rowLabels];
    //         columnLabels.reverse();
    //         rowLabels = [...scratch];
    //         rowLabels.reverse();
    //     }

    //     // Columns (letters)
    //     for (let col = 0; col < width; col++) {
    //         const pointTop = {x: grid[0][col].x, y: grid[0][col].y - (cellsize) - (show.includes("N") ? bufferwidth : 0)};
    //         const pointBottom = {x: grid[height - 1][col].x, y: grid[height - 1][col].y + (cellsize) + (show.includes("S") ? bufferwidth : 0)};
    //         if (! hideHalf) {
    //             labels.text(columnLabels[col]).fill(labelColour).opacity(labelOpacity).center(pointTop.x, pointTop.y);
    //         }
    //         labels.text(columnLabels[col]).fill(labelColour).opacity(labelOpacity).center(pointBottom.x, pointBottom.y);
    //     }

    //     // Rows (numbers)
    //     for (let row = 0; row < height; row++) {
    //         const pointL = {x: grid[row][0].x - (cellsize) - (show.includes("W") ? bufferwidth : 0), y: grid[row][0].y};
    //         const pointR = {x: grid[row][width - 1].x + (cellsize) + (show.includes("E") ? bufferwidth : 0), y: grid[row][width - 1].y};
    //         labels.text(rowLabels[row]).fill(labelColour).opacity(labelOpacity).center(pointL.x, pointL.y);
    //         if (! hideHalf) {
    //             labels.text(rowLabels[row]).fill(labelColour).opacity(labelOpacity).center(pointR.x, pointR.y);
    //         }
    //     }
    // }

    // Draw grid lines
    // use graphs to determine connections and then draw each connection
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

    for (const entry of graph.graph.edgeEntries()) {
        const x1 = (entry.sourceAttributes as PentagonalNodeData).x;
        const y1 = (entry.sourceAttributes as PentagonalNodeData).y;
        const x2 = (entry.targetAttributes as PentagonalNodeData).x;
        const y2 = (entry.targetAttributes as PentagonalNodeData).y;
        gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"}).attr({ 'pointer-events': 'none' });
    }

    if (ctx.options.boardClick !== undefined) {
        const rotation = ctx.getRotation();
        const centre = ctx.getBoardCentre();
        const root = ctx.rootSvg;
        const genericCatcher = ((e: { clientX: number; clientY: number; }) => {
            const clicked = rotatePoint(root.point(e.clientX, e.clientY), rotation*-1, centre);
            // simply find the point that's closest to the click
            const closest = {
                dist: Infinity,
                row: null as (null|number),
                col: null as (null|number),
            };
            for (let row = 0; row < grid.length; row++) {
                for (let col = 0; col < grid[row].length; col++) {
                    const pt = grid[row][col];
                    const dist = ptDistance(pt.x, pt.y, clicked.x, clicked.y);
                    if (dist < closest.dist) {
                        closest.dist = dist;
                        closest.row = row;
                        closest.col = col;
                    }
                }
            }
            if (closest.dist !== Infinity && closest.row !== null && closest.col !== null) {
                ctx.options.boardClick!(closest.row, closest.col, "");
            }
        });
        ctx.rootSvg.click(genericCatcher);
    }

    ctx.markBoard({svgGroup: gridlines, preGridLines: false, grid});

    return grid;
}
