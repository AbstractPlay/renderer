import { IPolyPolygon, rectOfRects } from "../grids/index.js";
import { IPoint} from "../grids/_base.js";
import { RendererBase } from "../renderers/_base.js";
import { Graph, SquareOrthGraph } from "../graphs/index.js";
import {
    attachNearestGridPointClick,
    BoardClickBlockedCell,
    BoardReturn,
    CompassDirection,
    createGridlineLayers,
    getBoardFill,
} from "./index.js";
import { offsetPolygon } from "../common/plotting.js";
import {
    hiddenRectLabelSides,
    resolveRectEdgeLabelStrings,
    shouldDrawRectLabelSide,
    type RectEdgeLabelsOverride,
} from "./rectEdgeLabels.js";
import { BoardBasic } from "../schemas/schema.js";

const BRICKA_OUTLINE_EDGE_ORDER: CompassDirection[] = ["W", "NW", "NE", "E", "SE", "SW"];

function brickaOutlineFromEdges(boardEdges: Map<CompassDirection, IPolyPolygon>): IPoint[] {
    const points: IPoint[] = [];
    for (const dir of BRICKA_OUTLINE_EDGE_ORDER) {
        const seg = boardEdges.get(dir);
        if (seg !== undefined) {
            points.push(...seg.points);
        }
    }
    return points;
}

export const bricka = (ctx: RendererBase): BoardReturn => {
    if ( (ctx.json === undefined) || (ctx.rootSvg === undefined) || (ctx.json.board === null) ) {
        throw new Error("Object in an invalid state!");
    }

    // Hard-code size to the only official board size
    const width: number = 13;
    const height: number = 13;
    const cellsize = ctx.cellsize;

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

    // start generating the SVG
    const board = ctx.rootSvg.group().id("board");
    const layers = createGridlineLayers(board);
    const gridlines = layers.root;

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
        const hiddenSides = hiddenRectLabelSides(ctx.json.options);
        const labels = board.group().id("labels");
        let customLabels: string[]|undefined;
        if ( ("columnLabels" in ctx.json.board) && (ctx.json.board.columnLabels !== undefined) ) {
            customLabels = ctx.json.board.columnLabels;
        }
        let edgeLabels: RectEdgeLabelsOverride | undefined;
        if ( ("edgeLabels" in ctx.json.board) && (ctx.json.board.edgeLabels !== undefined) ) {
            edgeLabels = ctx.json.board.edgeLabels as RectEdgeLabelsOverride;
        }
        const edge = resolveRectEdgeLabelStrings(ctx, {
            width,
            height,
            columnLabels: customLabels,
            rowLabels: (ctx.json.board as BoardBasic).rowLabels,
            edgeLabels,
            options: ctx.json.options,
        });

        // Columns (letters)
        for (let col = 0; col < width; col++) {
            const pointTop = {x: grid[0][col].x, y: grid[0][col].y - (cellsize)};
            const pointBottom = {x: grid[height - 1][col].x, y: grid[height - 1][col].y + (cellsize)};
            if (shouldDrawRectLabelSide(hiddenSides, "north")) {
                ctx.applyCoordinateLabelStyle(labels.text(edge.north[col]), labelColour, labelOpacity).center(pointTop.x, pointTop.y);
            }
            if (shouldDrawRectLabelSide(hiddenSides, "south")) {
                ctx.applyCoordinateLabelStyle(labels.text(edge.south[col]), labelColour, labelOpacity).center(pointBottom.x, pointBottom.y);
            }
        }

        // Rows (numbers)
        for (let row = 0; row < height; row++) {
            const pointL = {x: grid[row][0].x - (cellsize), y: grid[row][0].y};
            const pointR = {x: grid[row][width - 1].x + (cellsize), y: grid[row][width - 1].y};
            if (shouldDrawRectLabelSide(hiddenSides, "west")) {
                ctx.applyCoordinateLabelStyle(labels.text(edge.west[row]), labelColour, labelOpacity).center(pointL.x, pointL.y);
            }
            if (shouldDrawRectLabelSide(hiddenSides, "east")) {
                ctx.applyCoordinateLabelStyle(labels.text(edge.east[row]), labelColour, labelOpacity).center(pointR.x, pointR.y);
            }
        }
    }


    // Start from a square graph, drop all nodes
    // we don't need, and define the needed diagonal edges
    const graph: Graph = new SquareOrthGraph(width, height);

    function dropIfHas(x: number, y: number) {
        if(graph.hasNode([x, y])) {
            graph.dropNode([x, y]);
        }
    }

    function dropSymm(x: number, y: number) {
        /* Drop nodes with 4-way symmetry */
        dropIfHas(x, y);
        dropIfHas(width - x - 1, y);
        dropIfHas(x, height - y - 1);
        dropIfHas(width - x - 1, height - y - 1);
    }

    function addEdge(x1: number, y1: number, x2: number, y2: number) {
        const nodeA = [x1, y1].join(",");
        const nodeB = [x2, y2].join(",");
        if (!graph.graph.hasEdge(nodeA, nodeB)) {
            graph.graph.addEdge(nodeA, nodeB);
        }
    }

    function addEdgeSymm(x1: number, y1: number, x2: number, y2: number) {
        /* Add edges with 4-way symmetry */
        addEdge(x1, y1, x2, y2);
        addEdge(width - x1 - 1, y1, width - x2 - 1, y2);
        addEdge(x1, height - y1 - 1, x2, height - y2 - 1);
        addEdge(width - x1 - 1, height - y1 - 1, width - x2 - 1, height - y2 - 1);
    }

    // Remove the corners
    const cornerDrops = [5, 4, 2, 1, 1, 1];
    cornerDrops.forEach((maxY, x) => {
        for (let y = 0; y < maxY; y++) {
            dropSymm(x, y);
        }
    });

    // Remove centers of the polygons
    const polyDrops = [
        [1, 6],
        [2, 5],
        [3, 3],
        [3, 6],
        [4, 2],
        [4, 4],
        [5, 3],
        [5, 6],
        [6, 1],
        [6, 5]
    ]
    polyDrops.forEach(([x, y]) => {
        dropSymm(x, y);
    });

    // Remove nodes on the midpoint of long horizontal connections
    const midDrops = [
        [0, 6],
        [2, 3],
        [4, 6],
        [6, 3]
    ]
    midDrops.forEach(([x, y]) => {
        dropSymm(x, y);
        addEdgeSymm(x, y - 1, x, y + 1);
    });

    // Vertical:
    const vDrops = [
        [4, 1]
    ]
    vDrops.forEach(([x, y]) => {
        dropSymm(x, y);
        addEdgeSymm(x - 1, y, x + 1, y);
    });

    // Add diagonals
    const diags = [
        [2, 6, 1, 5],
        [2, 6, 3, 5],
        [6, 6, 5, 5],
        [4, 3, 3, 2],
        [4, 3, 3, 4],
        [4, 3, 5, 2],
        [4, 3, 5, 4],
        [6, 0, 5, 1]
    ]
    diags.forEach(([x1, y1, x2, y2]) => {
        addEdgeSymm(x1, y1, x2, y2);
    });
    
    // derive the board edge polygon, this will be used for boardFill and in the
    // renderer _base.ts for the edge markings. Going clockwise starting from the
    // leftmost point.
    
    const leftpt = [6, 0]
    const NW = [
        [5, 1],
        [3, 1],
        [3, 2],
        [2, 2],
        [2, 4],
        [1, 4],
        [1, 5],
        [0, 5]
    ]
    let NE = [...NW]
    NE.reverse();
    NE = NE.map(([x, y]) => ([x, height - y - 1]));
    const rightpt = [6, height - 1]
    let SE = [...NE]
    SE.reverse();
    SE = SE.map(([x, y]) => ([width - x - 1, y]));
    let SW = [...NW]
    SW.reverse();
    SW = SW.map(([x, y]) => ([width - x - 1, y]));

    const boardEdges: Map<CompassDirection, IPolyPolygon> = new Map([
        ["W", [leftpt]],
        ["NW", NW],
        ["NE", NE],
        ["E", [rightpt]],
        ["SE", SE],
        ["SW", SW]
    ].map(([k, pts]) => ([(k as CompassDirection), {type: "poly", points: (pts as number[][]).map(([x, y]) => (grid[x][y]))}])))

    // Polygons are indexed by their center coordinate, there will be empty spots
    // in the array.
    const polys: IPolyPolygon[][] = [];
    for (let i = 0; i < 13; i++) {
        polys[i] = [];
    }
    const polyCenters = [
        [1, 6],
        [2, 5],
        [3, 3],
        [3, 6],
        [4, 2],
        [4, 4],
        [5, 3],
        [5, 6],
        [6, 1],
        [6, 5]
    ]
    polyCenters.push(...polyCenters.map(([x, y]) => ([width - x - 1, y])));
    polyCenters.push(...polyCenters.map(([x, y]) => ([x, height - y - 1])));
    const offsets = [
        [-1, -1],
        [-1, 0],
        [-1, 1],
        [0, 1],
        [1, 1],
        [1, 0],
        [1, -1],
        [0, -1]
    ]
    
    polyCenters.forEach(([x, y]) => {
        if(!(y in polys[x])) {
            const pts: IPoint[] = [];
            offsets.forEach(([dx, dy]) => {
                if(graph.hasNode([x + dx, y + dy])) {
                    pts.push(grid[x + dx][y + dy]);
                }
            });
            polys[x][y] = {
                type: "poly",
                points: pts
            };
        }
    });

    /* Everything generated, now do the actual drawing */

    const outline = brickaOutlineFromEdges(boardEdges);
    const boardFill: IPolyPolygon = {
        type: "poly",
        points: offsetPolygon(outline, cellsize / 1.5),
    };

    // Do boardfill before the markers
    const [hexFill, hexOpacity] = getBoardFill(ctx, "white");
    layers.fill.polygon(outline.map((p) => `${p.x},${p.y}`).join(" ")).fill(hexFill!).opacity(hexOpacity);

    ctx.markBoard({svgGroup: gridlines, preGridLines: true, grid, polys: polys, boardEdges: boardEdges});


    // Draw the edges based on the graph
    graph.graph.forEachEdge(
        (_edge, _attributes, source, target) => {
            const [cx1, cy1]: number[] = source.split(",").map(s => parseInt(s, 10));
            const [cx2, cy2]: number[] = target.split(",").map(s => parseInt(s, 10));
            const x1: number = grid[cx1][cy1].x;
            const y1: number = grid[cx1][cy1].y;
            const x2: number = grid[cx2][cy2].x;
            const y2: number = grid[cx2][cy2].y;
            layers.strokes.line(x1, y1, x2, y2).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity, linecap: "round", linejoin: "round"}).attr({ 'pointer-events': 'none' });
        }
    );

    // Draw dots for each cell
    graph.graph.forEachNode(
        (node) => {
            const [x, y]: number[] = node.split(",").map(s => parseInt(s, 10));
            const pt = grid[x][y];
            layers.strokes.circle(baseStroke * 7.5)
                .attr({ 'pointer-events': 'none' })
                .fill(baseColour)
                .opacity(baseOpacity)
                .stroke({width: 0})
                .center(pt.x, pt.y);
        }
    );

    ctx.markBoard({svgGroup: gridlines, preGridLines: false, grid, polys: polys, boardEdges: boardEdges});

    if (ctx.options.boardClick !== undefined) {
        const blocked: BoardClickBlockedCell[] = [];
        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                if (!graph.hasNode([row, col])) {
                    blocked.push({ row, col });
                }
            }
        }
        attachNearestGridPointClick(board, grid, boardFill, ctx.options.boardClick, { blocked });
    }

    return {grid, polys};
}
