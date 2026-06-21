import { IPolyPolygon, bentTri as bentTriGrid } from "../grids";
import { RendererBase } from "../renderers/_base";
import { calcBearing, projectPoint, ptDistance, rotatePoint } from "../common/plotting";
import { bentTriBoard } from "../common/bentTri";
import { BentTri, BentTriNodeData } from "../graphs";
import { BoardReturn } from ".";

export const bentTri = (ctx: RendererBase): BoardReturn => {
    if ( (ctx.json === undefined) || (ctx.rootSvg === undefined) ) {
        throw new Error("Object in an invalid state!");
    }

    let edgePoints: number|undefined;
    if ( (ctx.json.board === null) || ( (! ("width" in ctx.json.board)) && (! ("height" in ctx.json.board)) ) || ( (ctx.json.board.width === undefined) && (ctx.json.board.height === undefined) ) ) {
        throw new Error("Either the `width` or `height` property must be set for this board type.");
    }
    if ( ("width" in ctx.json.board) && ctx.json.board.width !== undefined ) {
        edgePoints = ctx.json.board.width;
    } else if ( ("height" in ctx.json.board) && ctx.json.board.height !== undefined ) {
        edgePoints = ctx.json.board.height;
    } else {
        throw new Error("Either the `width` or `height` property must be set for this board type.");
    }
    if ( (! ("style" in ctx.json.board)) || (ctx.json.board.style === undefined) ) {
        throw new Error("This function requires that a board style be defined.");
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

    const frequency = edgePoints - 1;
    const topo = bentTriBoard(frequency);
    const { grid, positions } = bentTriGrid({ bentTriGraph: topo, closeHubGaps: false });
    const graph = new BentTri(topo, positions);
    const board = ctx.rootSvg.group().id("board");

    const gridlines = board.group().id("gridlines");
    ctx.markBoard({svgGroup: gridlines, preGridLines: true, grid});

    type Blocked = [{row: number;col: number;},...{row: number;col: number;}[]];
    let blocked: Blocked|undefined;
    if ( (ctx.json.board.blocked !== undefined) && (ctx.json.board.blocked !== null) && (Array.isArray(ctx.json.board.blocked)) && (ctx.json.board.blocked.length > 0) ){
        blocked = [...(ctx.json.board.blocked as Blocked)];
    }
    if (blocked !== undefined) {
        for (const entry of blocked) {
            const vertex = topo.gridLayers[entry.row]?.[entry.col];
            if (vertex !== undefined) {
                graph.graph.dropNode(String(vertex.id));
            }
        }
    }

    for (const entry of graph.graph.edgeEntries()) {
        const x1 = (entry.sourceAttributes as BentTriNodeData).x;
        const y1 = (entry.sourceAttributes as BentTriNodeData).y;
        const x2 = (entry.targetAttributes as BentTriNodeData).x;
        const y2 = (entry.targetAttributes as BentTriNodeData).y;
        gridlines.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"}).attr({ 'pointer-events': 'none' });
    }

    if (ctx.options.boardClick !== undefined) {
        const rotation = ctx.getRotation();
        const centre = ctx.getBoardCentre();
        const root = ctx.rootSvg;
        const genericCatcher = ((e: { clientX: number; clientY: number; }) => {
            const clicked = rotatePoint(root.point(e.clientX, e.clientY), rotation*-1, centre);
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

    const centre = grid[0][0];
    const outer = [...grid[grid.length - 1]];
    const boardFill: IPolyPolygon = {
        type: "poly",
        points: outer.map(p => {
            const bearing = calcBearing(centre.x, centre.y, p.x, p.y);
            const dist = ptDistance(centre.x, centre.y, p.x, p.y) + (ctx.cellsize / 1.5);
            const [nx, ny] = projectPoint(centre.x, centre.y, dist, bearing);
            return {x: nx, y: ny};
        })
    };

    return {grid, boardFill};
}
