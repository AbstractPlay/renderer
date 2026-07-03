
import { FillData, StrokeData, Svg, G as SVGG, Gradient as SVGGradient, Circle as SVGCircle, Polygon as SVGPolygon, Path as SVGPath, TimeLike, Symbol as SVGSymbol, Use } from "@svgdotjs/svg.js";
import { GridPoints, IPoint, IPolyCircle, IPolyPolygon, Poly } from "../grids/_base";
import { AnnotationBasic, APRenderRep, AreaKey, IsometricPieces, IsoPiece, RowCol } from "../schemas/schema";
import { IRendererOptionsIn, RendererBase } from "./_base";
import { circle2poly, deg2rad } from "../common/plotting";
import { Matrix } from "transformation-matrix-js";
import { generateCubes, CubeFaceFills } from "./isometric/cubes";
import { effectiveCubeYaw, permuteCubeFaces } from "./isometric/cubeOrientation";
import { generateCylinders } from "./isometric/cylinders";
import { generateHexes } from "./isometric/hexes";
import { compareCellSortKeys, computeCellSortKey } from "./isometric/cellSort";
import { parseIsoPiecesString } from "./isometric/piecesGrid";
import { buildIsoProjectionMatrix, isoLabelTransform } from "./isometric/projection";
import { isoShadeFace, isoShadeFaces, IsoFaceFills } from "./isometric/shading";
import { ensureIsoContactBlurFilter, isoContactShadow } from "./isometric/shadow";
import { isoSymbolDimensions, isoSymbolPlacement } from "./isometric/symbolPlacement";
import { IsoPiecesGrid, isMultiFaceCube, parseStackEntry } from "./isometric/stack";
import { x2uid } from "../common/glyph2uid";
import { Orientation } from "honeycomb-grid";
import { hexOfCir, hexOfHex, squares } from "../boards";

type PointEntry = {
    col: number;
    row: number;
    x: number;
    y: number;
    xOrig: number;
    yOrig: number;
    poly: Poly;
};

interface ITarget {
    row: number;
    col: number;
}

type IsoLegend = {[k: string]: IsoPiece};

const rotationMap = new Map<IsometricPieces, Map<number, IsometricPieces>>([
    ["lintelN", new Map([
        [1, "lintelE"],
        [2, "lintelS"],
        [3, "lintelW"],
    ])],
    ["lintelE", new Map([
        [1, "lintelS"],
        [2, "lintelW"],
        [3, "lintelN"],
    ])],
    ["lintelS", new Map([
        [1, "lintelW"],
        [2, "lintelN"],
        [3, "lintelE"],
    ])],
    ["lintelW", new Map([
        [1, "lintelN"],
        [2, "lintelE"],
        [3, "lintelS"],
    ])],
    ["lintelNS", new Map([
        [1, "lintelEW"],
        [2, "lintelNS"],
        [3, "lintelEW"],
    ])],
    ["lintelEW", new Map([
        [1, "lintelNS"],
        [2, "lintelEW"],
        [3, "lintelNS"],
    ])],
]);

const PIECE_STROKE_MULTIPLIER = 2;

const toFaceFillsData = (fills: IsoFaceFills): CubeFaceFills => ({
    top: { color: fills.top },
    left: { color: fills.left },
    right: { color: fills.right },
});

/**
 * The `stacking-offset` renderer creates stacks of pieces by offsetting them slightly to give a 3D look.
 *
 */
export class IsometricRenderer extends RendererBase {

    public static readonly rendererName: string = "isometric";
    constructor() {
        super();
    }

    public render(json: APRenderRep, draw: Svg, options: IRendererOptionsIn): void {
        this.jsonPrechecks(json);
        if (this.json === undefined) {
            throw new Error("JSON prechecks fatally failed.");
        }
        this.optionsPrecheck(options);
        // only allow pieces from the isometric sheet to be loaded
        this.options.sheets=["isometric"];
        this.rootSvg = draw;

        if (this.json.board === null) {
            throw new Error("This renderer requires that `board` be defined.");
        }

        // BOARD
        // Delegate to style-specific renderer
        let gridPoints: GridPoints;
        let polys: Poly[][]|undefined;
        let boardFill: Poly|undefined;
        if (! ("style" in this.json.board)) {
            throw new Error(`This 'board' schema cannot be handled by the '${ IsometricRenderer.rendererName }' renderer.`);
        }

        // In this renderer, the legend is bespoke and glyphs are rendered on the fly
        // // Load all the pieces in the legend (have to do this early so the glyphs are available for marking the board)
        // this.loadLegend();

        let basePcScale = 1;
        switch (this.json.board.style) {
            case "squares":
                ({ grid: gridPoints, polys, boardFill } = squares(this, {noSvg: true}));
                break;
            case "hex-of-hex":
                ({ grid: gridPoints, polys, boardFill } = hexOfHex(this, {noSvg: true}));
                basePcScale = 0.85;
                break;
            case "hex-of-cir":
                ({ grid: gridPoints, polys, boardFill } = hexOfCir(this, {noSvg: true}));
                basePcScale = 0.85;
                break;
            default:
                throw new Error(`The requested board style (${ this.json.board.style }) is not supported by the '${ IsometricRenderer.rendererName }' renderer.`);
        }
        if (polys === undefined) {
            throw new Error("Polys should be defined by this point.");
        }

        type Blocked = RowCol[];
        let blocked: Blocked|undefined;
        if ( (this.json.board.blocked !== undefined) && (this.json.board.blocked !== null)  && (Array.isArray(this.json.board.blocked)) && (this.json.board.blocked.length > 0) ){
            blocked = [...(this.json.board.blocked as Blocked)];
        }

        let board = this.rootSvg.findOne("#board") as SVGG;
        if (board === null) {
            board = this.rootSvg.group().id("board");
        }

        const boardLocalGrid: GridPoints = gridPoints.map(row => row.map(pt => ({ x: pt.x, y: pt.y })));

        // any user-specified rotation has to happen before laying everything out
        const boardRotation = this.getRotation();
        let extraRotation = 90 * Math.floor(boardRotation / 90);
        while (extraRotation < 0) { extraRotation += 360; }
        extraRotation = extraRotation % 360;
        let tUserRotate = new Matrix();
        if (extraRotation !== 0) {
            const centre = this.boardGridCentre(boardLocalGrid);
            tUserRotate = new Matrix()
                .translate(centre.x, centre.y)
                .rotate(deg2rad(extraRotation))
                .translate(-centre.x, -centre.y);
            gridPoints = gridPoints.map(row => row = row.map(pt => tUserRotate.applyToPoint(pt.x, pt.y)));
            polys = this.rotatePolys(polys, tUserRotate);
        }
        const numRotations = Math.floor(extraRotation / 90) % 4;

        let strokeWeight = 1;
        if ("strokeWeight" in this.json.board && this.json.board.strokeWeight !== undefined) {
            strokeWeight = this.json.board.strokeWeight;
        }
        let strokeColour = this.options.colourContext.strokes;
        if ("strokeColour" in this.json.board && this.json.board.strokeColour !== undefined) {
            strokeColour = this.resolveColour(this.json.board.strokeColour) as string;;
        }
        let strokeOpacity = 1;
        if ("strokeOpacity" in this.json.board && this.json.board.strokeOpacity !== undefined) {
            strokeOpacity = this.json.board.strokeOpacity;
        }
        const surfaceStrokeWeight = strokeWeight;
        const pieceStrokeWeight = strokeWeight * PIECE_STROKE_MULTIPLIER;
        const surfaceStroke: StrokeData = {width: surfaceStrokeWeight, color: strokeColour, opacity: strokeOpacity};
        const pieceStroke: StrokeData = {width: pieceStrokeWeight, color: strokeColour, opacity: strokeOpacity};

        ensureIsoContactBlurFilter(this.rootSvg.defs().node as SVGDefsElement);

        const tFinal = buildIsoProjectionMatrix();
        // "isometricize" the points and polys
        gridPoints = gridPoints.map(row => row = row.map(pt => tFinal.applyToPoint(pt.x, pt.y)));
        if (this.json.board.style === "squares" || this.json.board.style === "hex-of-hex") {
            polys = (polys as IPolyPolygon[][]).map(row => row = row.map(poly => poly = {...poly, points: poly.points.map(pt => tFinal.applyToPoint(pt.x, pt.y))} as IPolyPolygon));
        } else if (this.json.board.style === "hex-of-cir") {
            polys = (polys as IPolyCircle[][]).map(row => row.map(poly => {
                return {
                    type: "poly",
                    points: circle2poly(poly.cx, poly.cy, poly.r).map(([x,y]) => tFinal.applyToPoint(x,y)),
                } as IPolyPolygon;
            }));
        }

        // sort the points in order of top to bottom, left to right
        // to ensure that everything overlaps appropriately
        const transformedPoints: PointEntry[] = [];
        for (let iRow = 0; iRow < gridPoints.length; iRow++) {
            const row = gridPoints[iRow];
            for (let iCol = 0; iCol < row.length; iCol++) {
                const point = row[iCol];
                transformedPoints.push({
                    col: iCol,
                    row: iRow,
                    x: point.x,
                    y: point.y,
                    xOrig: point.x,
                    yOrig: point.y,
                    poly: polys[iRow][iCol],
                });
            }
        }
        let heightmap: number[][]|undefined;
        let allHeights: number[] = [0];
        if ("heightmap" in this.json.board && this.json.board.heightmap !== undefined) {
            heightmap = this.json.board.heightmap;
            allHeights = [...new Set(heightmap.flat()).values()];
        }

        // initialize the list of pieces (parsed before sort so stack depth is known)
        let pieces: IsoPiecesGrid | undefined;
        if (this.json.pieces !== null) {
            if (typeof this.json.pieces === "string") {
                const boardWidth = ("width" in this.json.board && this.json.board.width !== undefined)
                    ? this.json.board.width
                    : undefined;
                pieces = parseIsoPiecesString(this.json.pieces, gridPoints, boardWidth);
            } else if ( (this.json.pieces instanceof Array) && (this.json.pieces[0] instanceof Array) && (this.json.pieces[0][0] instanceof Array) ) {
                pieces = this.json.pieces as IsoPiecesGrid;
            } else {
                throw new Error("Unrecognized `pieces` property.");
            }
        }
        for (const height of allHeights) {
            const id = `_surface_${height.toString().replace(".", "_")}`;
            const surfaceFills = toFaceFillsData(isoShadeFaces(this.options.colourContext.background));
            switch (this.json.board.style) {
                case "squares":
                    generateCubes({rootSvg: this.rootSvg, heights: [height], stroke: surfaceStroke, fill: surfaceFills.top, faceFills: surfaceFills, idSymbol: id})
                    break;
                case "hex-of-cir":
                    generateCylinders({rootSvg: this.rootSvg, heights: [height], stroke: surfaceStroke, fill: surfaceFills.top, faceFills: surfaceFills, idSymbol: id})
                    break;
                case "hex-of-hex":
                    generateHexes({rootSvg: this.rootSvg, heights: [height], stroke: surfaceStroke, fill: surfaceFills.top, faceFills: surfaceFills, idSymbol: id, orientation: numRotations % 2 === 0 ? Orientation.POINTY : Orientation.FLAT})
                    break;
                default:
                    throw new Error("Could not determine how to build the board surface.");
            }
        }

        // now load the custom legend
        let legend: IsoLegend|undefined;
        if (this.json.legend !== null && this.json.legend !== undefined) {
            legend = this.json.legend as IsoLegend;
            for (const [key, pc] of Object.entries(this.json.legend as IsoLegend)) {
                // pieces may change based on rotation
                let effPiece = pc.piece;
                if (numRotations > 0) {
                    if (rotationMap.has(pc.piece)) {
                        const next = rotationMap.get(pc.piece)!;
                        if (next.has(numRotations)) {
                            effPiece = next.get(numRotations)!;
                        }
                    }
                }

                // generate the pieces
                if (isMultiFaceCube(pc)) {
                    for (let y = 0; y < 4; y++) {
                        const visible = permuteCubeFaces(pc.faces, y);
                        const top = this.resolveColour(visible.top, "#000") as string;
                        const left = this.resolveColour(visible.left, "#000") as string;
                        const right = this.resolveColour(visible.right, "#000") as string;
                        generateCubes({
                            rootSvg: this.rootSvg,
                            heights: [pc.height ?? 100],
                            stroke: pieceStroke,
                            fill: {color: isoShadeFace(top, "top")},
                            faceFills: {
                                top: {color: isoShadeFace(top, "top")},
                                left: {color: isoShadeFace(left, "left")},
                                right: {color: isoShadeFace(right, "right")},
                            },
                            idSymbol: `${key}__y${y}`,
                        });
                    }
                } else if (!("colour" in pc)) {
                    throw new Error(`Legend entry "${key}" is missing colour.`);
                } else if (effPiece === "cube") {
                    const fills = toFaceFillsData(isoShadeFaces(this.resolveColour(pc.colour, "#000") as string));
                    generateCubes({rootSvg: this.rootSvg, heights: [pc.height], stroke: pieceStroke, fill: fills.top, faceFills: fills, idSymbol: key});
                } else if (effPiece === "lintelN") {
                    const fills = toFaceFillsData(isoShadeFaces(this.resolveColour(pc.colour, "#000") as string));
                    generateCubes({rootSvg: this.rootSvg, heights: [pc.height], stroke: pieceStroke, fill: fills.top, faceFills: fills, idSymbol: key, sides: ["E", "S", "W"]});
                } else if (effPiece === "lintelE") {
                    const fills = toFaceFillsData(isoShadeFaces(this.resolveColour(pc.colour, "#000") as string));
                    generateCubes({rootSvg: this.rootSvg, heights: [pc.height], stroke: pieceStroke, fill: fills.top, faceFills: fills, idSymbol: key, sides: ["N", "S", "W"]});
                } else if (effPiece === "lintelS") {
                    const fills = toFaceFillsData(isoShadeFaces(this.resolveColour(pc.colour, "#000") as string));
                    generateCubes({rootSvg: this.rootSvg, heights: [pc.height], stroke: pieceStroke, fill: fills.top, faceFills: fills, idSymbol: key, sides: ["E", "N", "W"]});
                } else if (effPiece === "lintelW") {
                    const fills = toFaceFillsData(isoShadeFaces(this.resolveColour(pc.colour, "#000") as string));
                    generateCubes({rootSvg: this.rootSvg, heights: [pc.height], stroke: pieceStroke, fill: fills.top, faceFills: fills, idSymbol: key, sides: ["E", "S", "N"]});
                } else if (effPiece === "lintelNS") {
                    const fills = toFaceFillsData(isoShadeFaces(this.resolveColour(pc.colour, "#000") as string));
                    generateCubes({rootSvg: this.rootSvg, heights: [pc.height], stroke: pieceStroke, fill: fills.top, faceFills: fills, idSymbol: key, sides: ["E", "W"]});
                } else if (effPiece === "lintelEW") {
                    const fills = toFaceFillsData(isoShadeFaces(this.resolveColour(pc.colour, "#000") as string));
                    generateCubes({rootSvg: this.rootSvg, heights: [pc.height], stroke: pieceStroke, fill: fills.top, faceFills: fills, idSymbol: key, sides: ["N", "S"]});
                } else if (effPiece === "spaceCube") {
                    const fills = toFaceFillsData(isoShadeFaces(this.resolveColour(pc.colour, "#000") as string));
                    generateCubes({rootSvg: this.rootSvg, heights: [pc.height], stroke: pieceStroke, fill: fills.top, faceFills: fills, idSymbol: key, sides: []});
                } else if (effPiece === "cylinder") {
                    const fills = toFaceFillsData(isoShadeFaces(this.resolveColour(pc.colour, "#000") as string));
                    generateCylinders({rootSvg: this.rootSvg, heights: [pc.height], stroke: pieceStroke, fill: fills.top, faceFills: fills, idSymbol: key});
                } else if (effPiece === "hexp") {
                    const fills = toFaceFillsData(isoShadeFaces(this.resolveColour(pc.colour, "#000") as string));
                    generateHexes({rootSvg: this.rootSvg, heights: [pc.height], stroke: pieceStroke, fill: fills.top, faceFills: fills, idSymbol: key, orientation: Orientation.POINTY})
                } else if (effPiece === "hexf") {
                    const fills = toFaceFillsData(isoShadeFaces(this.resolveColour(pc.colour, "#000") as string));
                    generateHexes({rootSvg: this.rootSvg, heights: [pc.height], stroke: pieceStroke, fill: fills.top, faceFills: fills, idSymbol: key, orientation: Orientation.FLAT})
                } else {

                    throw new Error(`Unrecognized isoPiece type "${pc.piece}"`);
                }
            }
        }

        const sortKeyForEntry = (entry: PointEntry) =>
            computeCellSortKey({
                entry,
                cellsize: this.cellsize,
                boardLocalGrid,
                tUserRotate,
                heightmap,
                pieces,
                legend,
                basePcScale,
                boardRotation,
                rootSvg: this.rootSvg!,
            });
        transformedPoints.sort((a, b) => compareCellSortKeys(sortKeyForEntry(a), sortKeyForEntry(b)));

        // Now place the surface components and any pieces on top of them, one cell at a time.
        // To make things overlap correctly, we can't sort the board into logical groups.
        // Instead, each cell has to be rendered in its entirety before moving to the next cell.
        for (const entry of transformedPoints) {
            // skip blocked cells
            if (blocked !== undefined && blocked.find(b => b.row === entry.row && b.col === entry.col)) {
                continue;
            }
            let height = 0;
            if (heightmap !== undefined && heightmap.length >= entry.row + 1 && heightmap[entry.row].length >= entry.col + 1) {
                height = heightmap[entry.row][entry.col];
            }
            const idHeight = height.toString().replace(".", "_");
            const cell = this.rootSvg.findOne(`#_surface_${idHeight}`) as Svg;
            if ( (cell === null) || (cell === undefined) ) {
                throw new Error(`Could not find the requested surface of height ${idHeight}.`);
            }
            const surfacePlacement = isoSymbolPlacement(this.cellsize, entry.x, entry.y, cell, 1);
            entry.y = surfacePlacement.anchorY;
            let used = board.use(cell).move(surfacePlacement.newx, surfacePlacement.newy).size(surfacePlacement.newWidth, surfacePlacement.newHeight);
            if (this.options.boardClick !== undefined) {
                used.click((e : Event) => {this.options.boardClick!(entry.row, entry.col, ""); e.stopPropagation();});
            } else {
                used.attr({"pointer-events": "none"});
            }
            // move polys so they are at the correct height
            if (entry.poly.type === "poly") {
                const newpts: IPoint[] = entry.poly.points.map(pt => {return {...pt, y: pt.y - Math.abs(entry.yOrig - entry.y)}});
                entry.poly.points = newpts;
            } else if (entry.poly.type === "circle") {
                entry.poly.cy = entry.poly.cy - Math.abs(entry.yOrig - entry.y);
            }

            // do markers
            this.isoMark(board, entry, tFinal);

            // do pre-annotations
            if (this.options.showAnnotations) {
                this.preAnnotate(board, entry);
            }

            // place any pieces that belong on this cell
            if (pieces !== undefined) {
                const stack = pieces[entry.row]?.[entry.col] ?? [];
                for (const [idx, stackItem] of stack.entries()) {
                    const { glyph, yaw } = parseStackEntry(stackItem);
                    if (glyph === "" || glyph === "-") { continue; }
                    let pieceId = glyph;
                    if (legend !== undefined && legend[glyph] !== undefined && isMultiFaceCube(legend[glyph])) {
                        pieceId = `${glyph}__y${effectiveCubeYaw(yaw, boardRotation)}`;
                    }
                    const piece = this.rootSvg.findOne("#" + pieceId) as Svg;
                    if ( (piece === null) || (piece === undefined) ) {
                        throw new Error(`Could not find the requested piece (${pieceId}). Each piece in the \`pieces\` property *must* exist in the \`legend\`.`);
                    }
                    let pcScale = 0.75;
                    if (legend !== undefined && glyph in legend && "scale" in legend[glyph] && legend[glyph].scale !== undefined) {
                        pcScale = legend[glyph].scale as number;
                    }
                    pcScale *= basePcScale;
                    const piecePlacement = isoSymbolPlacement(this.cellsize, entry.x, entry.y, piece, pcScale);
                    entry.y = piecePlacement.anchorY;
                    if (!this.json.options?.includes("no-piece-shadow")) {
                        const dyBottom = parseFloat(piece.attr("data-dy-bottom") as string);
                        isoContactShadow(board, piecePlacement, dyBottom, this.cellsize);
                    }
                    used = board.use(piece).move(piecePlacement.newx, piecePlacement.newy).size(piecePlacement.newWidth, piecePlacement.newHeight);
                    if ( (this.options.boardClick !== undefined) && (! this.json.options?.includes("no-piece-click")) ) {
                        used.click((e : Event) => {this.options.boardClick!(entry.row, entry.col, idx.toString()); e.stopPropagation();});
                    } else {
                        used.attr({"pointer-events": "none"});
                    }
                }
            }
        }

        if (!this.json.options?.includes("hide-labels")) {
            this.placeBoardLabels(board, boardLocalGrid, tUserRotate, tFinal);
        }

        // do post-annotations
        if (this.options.showAnnotations) {
            this.postAnnotate(board, transformedPoints, tFinal);
        }

        // Create a new gridPoints with the new top coords of each cell
        for (let iRow = 0; iRow < gridPoints.length; iRow++) {
            const row = gridPoints[iRow];
            for (let iCol = 0; iCol < row.length; iCol++) {
                const entry = transformedPoints.find(e => e.row === iRow && e.col === iCol);
                if (entry === undefined) {
                    throw new Error(`Could not find a matching entry for col ${iCol}, row ${iRow}`);
                }
                gridPoints[iRow][iCol] = {x: entry.x, y: entry.y};
            }
        }

        // if there's a board backfill, it needs to be done before rotation
        const backfilled = this.backFill(boardFill, true);

        const box = board.rbox(this.rootSvg);

        // `pieces` area, if present
        this.piecesArea(box, {padding: 0});

        // button bar
        this.placeButtonBar(box, undefined, {padding: 0});

        // key
        this.placeKey(box, undefined, {padding: 0});

        if (!backfilled) {
            this.backFill(boardFill);
        }
    }

    private rotatePolys(polys: Poly[][], tUserRotate: Matrix): Poly[][] {
        return polys.map(row => row.map(poly => {
            if (poly.type === "circle") {
                const c = tUserRotate.applyToPoint(poly.cx, poly.cy);
                return { ...poly, cx: c.x, cy: c.y };
            }
            if (poly.type === "poly") {
                return {
                    ...poly,
                    points: poly.points.map(pt => tUserRotate.applyToPoint(pt.x, pt.y)),
                };
            }
            throw new Error(`Unsupported poly type for rotation: ${poly.type}`);
        }));
    }

    private boardGridCentre(grid: GridPoints): IPoint {
        const pts = grid.flat();
        return {
            x: pts.reduce((sum, pt) => sum + pt.x, 0) / pts.length,
            y: pts.reduce((sum, pt) => sum + pt.y, 0) / pts.length,
        };
    }

    private placeIsoLabel(labels: SVGG, text: string, localX: number, localY: number, tUserRotate: Matrix, tFinal: Matrix, colour: string, opacity: number): void {
        labels.text(text)
            .fill(colour)
            .opacity(opacity)
            .transform(isoLabelTransform(localX, localY, tUserRotate, tFinal))
            .attr({ "text-anchor": "middle", "dominant-baseline": "central" });
    }

    private placeBoardLabels(board: SVGG, boardLocalGrid: GridPoints, tUserRotate: Matrix, tFinal: Matrix): void {
        if ( (this.json === undefined) || (this.json.board === null) ) {
            throw new Error("Invalid object state.");
        }

        const gridHeight = boardLocalGrid.length;
        if (gridHeight === 0) {
            return;
        }

        let labelColour = this.options.colourContext.labels;
        if ( ("labelColour" in this.json.board) && (this.json.board.labelColour !== undefined) ) {
            labelColour = this.resolveColour(this.json.board.labelColour) as string;
        }
        let labelOpacity = 1;
        if ( ("labelOpacity" in this.json.board) && (this.json.board.labelOpacity !== undefined) ) {
            labelOpacity = this.json.board.labelOpacity;
        }

        if (!("style" in this.json.board) || this.json.board.style === undefined) {
            return;
        }

        const labels = board.group().id("labels").attr({ "pointer-events": "none" });
        const cellsize = this.cellsize;

        switch (this.json.board.style) {
            case "squares": {
                if ( (!("width" in this.json.board)) || (!("height" in this.json.board)) || (this.json.board.width === undefined) || (this.json.board.height === undefined) ) {
                    throw new Error("Both the `width` and `height` properties are required for this board type.");
                }
                const width = this.json.board.width;
                const boardHeight = this.json.board.height;
                let hideHalf = false;
                if (this.json.options?.includes("hide-labels-half")) {
                    hideHalf = true;
                }
                let customLabels: string[]|undefined;
                if ( ("columnLabels" in this.json.board) && (this.json.board.columnLabels !== undefined) ) {
                    customLabels = this.json.board.columnLabels;
                }
                let columnLabels = this.getLabels(customLabels, width);
                if (this.json.options?.includes("reverse-letters")) {
                    columnLabels.reverse();
                }
                let rowLabels = this.getRowLabels("rowLabels" in this.json.board ? this.json.board.rowLabels : undefined, boardHeight);
                if (this.json.options?.includes("reverse-numbers")) {
                    rowLabels.reverse();
                }
                if (this.json.options?.includes("swap-labels")) {
                    const scratch = [...columnLabels];
                    columnLabels = [...rowLabels];
                    columnLabels.reverse();
                    rowLabels = [...scratch];
                    rowLabels.reverse();
                }
                for (let col = 0; col < width; col++) {
                    const flatTop = {x: boardLocalGrid[0][col].x, y: boardLocalGrid[0][col].y - cellsize};
                    const flatBottom = {x: boardLocalGrid[boardHeight - 1][col].x, y: boardLocalGrid[boardHeight - 1][col].y + cellsize};
                    if (!hideHalf) {
                        this.placeIsoLabel(labels, columnLabels[col], flatTop.x, flatTop.y, tUserRotate, tFinal, labelColour, labelOpacity);
                    }
                    this.placeIsoLabel(labels, columnLabels[col], flatBottom.x, flatBottom.y, tUserRotate, tFinal, labelColour, labelOpacity);
                }
                for (let row = 0; row < boardHeight; row++) {
                    const flatL = {x: boardLocalGrid[row][0].x - cellsize, y: boardLocalGrid[row][0].y};
                    const flatR = {x: boardLocalGrid[row][width - 1].x + cellsize, y: boardLocalGrid[row][width - 1].y};
                    this.placeIsoLabel(labels, rowLabels[row], flatL.x, flatL.y, tUserRotate, tFinal, labelColour, labelOpacity);
                    if (!hideHalf) {
                        this.placeIsoLabel(labels, rowLabels[row], flatR.x, flatR.y, tUserRotate, tFinal, labelColour, labelOpacity);
                    }
                }
                break;
            }
            case "hex-of-hex":
            case "hex-of-cir": {
                let customLabels: string[]|undefined;
                if ( ("columnLabels" in this.json.board) && (this.json.board.columnLabels !== undefined) ) {
                    customLabels = this.json.board.columnLabels;
                }
                const columnLabels = this.getLabels(customLabels, gridHeight);
                if (this.json.options?.includes("reverse-letters")) {
                    columnLabels.reverse();
                }
                for (let row = 0; row < gridHeight; row++) {
                    let leftNum = "1";
                    let rightNum = boardLocalGrid[row].length.toString();
                    if (this.json.options?.includes("reverse-numbers")) {
                        const scratch = leftNum;
                        leftNum = rightNum;
                        rightNum = scratch;
                    }
                    const flatL = {x: boardLocalGrid[row][0].x - cellsize, y: boardLocalGrid[row][0].y};
                    const flatR = {x: boardLocalGrid[row][boardLocalGrid[row].length - 1].x + cellsize, y: boardLocalGrid[row][boardLocalGrid[row].length - 1].y};
                    const label = columnLabels[gridHeight - row - 1];
                    this.placeIsoLabel(labels, label + leftNum, flatL.x, flatL.y, tUserRotate, tFinal, labelColour, labelOpacity);
                    this.placeIsoLabel(labels, label + rightNum, flatR.x, flatR.y, tUserRotate, tFinal, labelColour, labelOpacity);
                }
                break;
            }
        }

        labels.back();
    }

    protected buildKey(key: AreaKey): Svg {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Invalid object state.");
        }

        let labelColour = this.options.colourContext.labels;
        if ( (this.json.board !== null) && ("labelColour" in this.json.board) && (this.json.board.labelColour !== undefined) ) {
            labelColour = this.resolveColour(this.json.board.labelColour) as string;
        }
        let height = this.cellsize * 0.333;
        if (key.height !== undefined) {
            height = this.cellsize * key.height;
        }
        let buffer = height * 0.1;
        if (key.buffer !== undefined) {
            buffer = height * key.buffer;
        }
        const nested = this.rootSvg.defs().nested().id("_key");
        const legend = this.json.legend as IsoLegend|undefined;

        const labels: SVGSymbol[] = [];
        const pieceDims: {width: number; height: number}[] = [];
        let maxGlyphWidth = 0;
        for (let i = 0; i < key.list.length; i++) {
            const k = key.list[i];
            const tmptxt = this.rootSvg.text(k.name).font({size: 17, fill: labelColour, anchor: "start"});
            const symtxt = nested.symbol();
            symtxt.text(k.name).font({size: 17, fill: labelColour, anchor: "start"});
            symtxt.viewbox(tmptxt.bbox());
            tmptxt.remove();
            labels.push(symtxt);

            const pieceId = this.resolveKeyPieceId(k.piece, legend);
            const piece = this.rootSvg.findOne("#" + pieceId) as Svg;
            if ( (piece === undefined) || (piece === null) ) {
                throw new Error(`Could not find the requested piece (${pieceId}). Each piece *must* exist in the \`legend\`.`);
            }
            const dims = this.isoPieceDimsForKey(piece, height, k.piece, legend);
            pieceDims.push(dims);
            maxGlyphWidth = Math.max(maxGlyphWidth, dims.width);
        }

        const glyphGap = height * 0.1;
        const glyphColumnWidth = maxGlyphWidth + glyphGap;

        const groups: Svg[] = [];
        let maxScaledWidth = 0;
        for (let i = 0; i < labels.length; i++) {
            const k = key.list[i];
            const symlabel = labels[i];
            const pieceId = this.resolveKeyPieceId(k.piece, legend);
            const piece = this.rootSvg.findOne("#" + pieceId) as Svg;
            let id = `_key_${k.name}`;
            if (k.value !== undefined) {
                id = `_key_${k.value}`;
            }
            const g = nested.nested().id(id);
            const dims = pieceDims[i];
            this.placeIsoPieceInKey(g, piece, height, glyphColumnWidth, dims);
            const factor = height / symlabel.viewbox().h;
            const labelWidth = symlabel.viewbox().w * factor;
            const usedLabel = g.use(symlabel).size(labelWidth, height).move(glyphColumnWidth, 0);
            maxScaledWidth = Math.max(maxScaledWidth, usedLabel.width() as number);
            groups.push(g);
        }

        let dy = 0;
        for (const g of groups) {
            g.dy(dy);
            dy += height + buffer;
        }

        nested.viewbox(0, 0, glyphColumnWidth + maxScaledWidth, (height * key.list.length) + (buffer * (key.list.length - 1)));
        return nested;
    }

    private resolveKeyPieceId(pieceKey: string, legend: IsoLegend|undefined): string {
        if (legend !== undefined && legend[pieceKey] !== undefined && isMultiFaceCube(legend[pieceKey])) {
            return `${pieceKey}__y${effectiveCubeYaw(0, this.getRotation())}`;
        }
        return pieceKey;
    }

    private getBasePcScale(): number {
        if (this.json?.board !== null && this.json?.board !== undefined && "style" in this.json.board) {
            if (this.json.board.style === "hex-of-hex" || this.json.board.style === "hex-of-cir") {
                return 0.85;
            }
        }
        return 1;
    }

    private getPieceScale(pieceKey: string, legend: IsoLegend|undefined): number {
        let pcScale = 1;
        if (legend !== undefined && pieceKey in legend && "scale" in legend[pieceKey] && legend[pieceKey].scale !== undefined) {
            pcScale = legend[pieceKey].scale as number;
        }
        return pcScale * this.getBasePcScale();
    }

    private isoPieceDimsForKey(piece: Svg, rowHeight: number, pieceKey: string, legend: IsoLegend|undefined): {width: number; height: number} {
        return isoSymbolDimensions(this.cellsize, piece, this.getPieceScale(pieceKey, legend), rowHeight);
    }

    private placeIsoPieceInKey(svg: Svg, piece: Svg, rowHeight: number, glyphColumnWidth: number, dims: {width: number; height: number}): Use {
        const newx = (glyphColumnWidth - dims.width) / 2;
        const newy = (rowHeight - dims.height) / 2;
        return svg.use(piece).move(newx, newy).size(dims.width, dims.height);
    }

    private preAnnotate(group: SVGG, entry: PointEntry) {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Object in an invalid state!");
        }

        if ( ("annotations" in this.json) && (this.json.annotations !== undefined) ) {
            for (const note of this.json.annotations as AnnotationBasic[]) {
                if ( (! ("type" in note)) || (note.type === undefined) ) {
                    throw new Error("Invalid annotation format found.");
                }
                const cloned = {...note};
                if ("targets" in cloned) {
                    // @ts-expect-error (only used to generate UUID)
                    delete cloned.targets;
                }
                if ((note.targets as ITarget[]).find(t => t.col === entry.col && t.row === entry.row) === undefined) {
                    continue;
                }

                if ( (note.type !== undefined) && (note.type === "enter") ) {
                    let colour = this.options.colourContext.annotations;
                    if ( ("colour" in note) && (note.colour !== undefined) ) {
                        colour = this.resolveColour(note.colour ) as string;
                    }
                    let strokeWeight = this.cellsize* 0.05;
                    if (this.json.board !== null && this.json.board !== undefined && "strokeWeight" in this.json.board && this.json.board.strokeWeight !== undefined) {
                        strokeWeight = this.json.board.strokeWeight;
                    }
                    let dasharray = (4 * Math.ceil(strokeWeight / (this.cellsize * 0.05))).toString();
                    if (note.dashed !== undefined && note.dashed !== null) {
                        dasharray = (note.dashed ).join(" ");
                    }
                    const poly = entry.poly;
                    if (poly.type === "circle") {
                        group.circle(poly.r * 2)
                            .addClass(`aprender-annotation-${x2uid(cloned)}`)
                            .fill("none")
                            .stroke({color: this.options.colourContext.background, width: strokeWeight, linecap: "round", linejoin: "round"})
                            .center(poly.cx, poly.cy)
                            .attr({ 'pointer-events': 'none' });
                        group.circle(poly.r * 2)
                            .addClass(`aprender-annotation-${x2uid(cloned)}`)
                            .fill("none")
                            .stroke({color: colour, width: strokeWeight, dasharray, linecap: "round", linejoin: "round"})
                            .center(poly.cx, poly.cy)
                            .attr({ 'pointer-events': 'none' });
                    } else if (poly.type === "path") {
                        group.path(poly.path)
                            .addClass(`aprender-annotation-${x2uid(cloned)}`)
                            .fill("none")
                            .stroke({color: this.options.colourContext.background, width: strokeWeight, linecap: "round", linejoin: "round"})
                            .attr({ 'pointer-events': 'none' });
                        group.path(poly.path)
                            .addClass(`aprender-annotation-${x2uid(cloned)}`)
                            .fill("none")
                            .stroke({color: colour, width: strokeWeight, dasharray, linecap: "round", linejoin: "round"})
                            .attr({ 'pointer-events': 'none' });
                    } else {
                        group.polygon(poly.points.map(({x,y}) => [x,y].join(",")).join(" "))
                            .addClass(`aprender-annotation-${x2uid(cloned)}`)
                            .fill("none")
                            .stroke({color: this.options.colourContext.background, width: strokeWeight, linecap: "round", linejoin: "round"})
                            .attr({ 'pointer-events': 'none' });
                        group.polygon(poly.points.map(({x,y}) => [x,y].join(",")).join(" "))
                            .addClass(`aprender-annotation-${x2uid(cloned)}`)
                            .fill("none")
                            .stroke({color: colour, width: strokeWeight, dasharray, linecap: "round", linejoin: "round"})
                            .attr({ 'pointer-events': 'none' });
                    }
                } else if ( (note.type !== undefined) && (note.type === "exit") ) {
                    let colour = this.options.colourContext.annotations;
                    if ( ("colour" in note) && (note.colour !== undefined) ) {
                        colour = this.resolveColour(note.colour ) as string;
                    }
                    let strokeWeight = this.cellsize* 0.05;
                    if (this.json.board !== null && this.json.board !== undefined && "strokeWeight" in this.json.board && this.json.board.strokeWeight !== undefined) {
                        strokeWeight = this.json.board.strokeWeight;
                    }
                    let dasharray = (4 * Math.ceil(strokeWeight / (this.cellsize * 0.05))).toString();
                    if (note.dashed !== undefined && note.dashed !== null) {
                        dasharray = (note.dashed ).join(" ");
                    }
                    const poly = entry.poly;
                    if (poly.type === "circle") {
                        group.circle(poly.r * 2)
                            .addClass(`aprender-annotation-${x2uid(cloned)}`)
                            .fill("none")
                            .stroke({color: this.options.colourContext.background, width: strokeWeight, linecap: "round", linejoin: "round"})
                            .center(poly.cx, poly.cy)
                            .attr({ 'pointer-events': 'none' });
                        group.circle(poly.r * 2)
                            .addClass(`aprender-annotation-${x2uid(cloned)}`)
                            .fill("none")
                            .stroke({color: colour, width: strokeWeight, dasharray, linecap: "round", linejoin: "round"})
                            .center(poly.cx, poly.cy)
                            .attr({ 'pointer-events': 'none' });
                    } else if (poly.type === "path") {
                        group.path(poly.path)
                            .addClass(`aprender-annotation-${x2uid(cloned)}`)
                            .fill("none")
                            .stroke({color: this.options.colourContext.background, width: strokeWeight, linecap: "round", linejoin: "round"})
                            .attr({ 'pointer-events': 'none' });
                        group.path(poly.path)
                            .addClass(`aprender-annotation-${x2uid(cloned)}`)
                            .fill("none")
                            .stroke({color: colour, width: strokeWeight, dasharray, linecap: "round", linejoin: "round"})
                            .attr({ 'pointer-events': 'none' });
                    } else {
                        group.polygon(poly.points.map(({x,y}) => [x,y].join(",")).join(" "))
                            .addClass(`aprender-annotation-${x2uid(cloned)}`)
                            .fill("none")
                            .stroke({color: this.options.colourContext.background, width: strokeWeight, linecap: "round", linejoin: "round"})
                            .attr({ 'pointer-events': 'none' });
                        group.polygon(poly.points.map(({x,y}) => [x,y].join(",")).join(" "))
                            .addClass(`aprender-annotation-${x2uid(cloned)}`)
                            .fill("none")
                            .stroke({color: colour, width: strokeWeight, dasharray, linecap: "round", linejoin: "round"})
                            .attr({ 'pointer-events': 'none' });
                    }
                }
            }
        }
    }

    private postAnnotate(group: SVGG, entries: PointEntry[], transform: Matrix) {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Object in an invalid state!");
        }

        if ( ("annotations" in this.json) && (this.json.annotations !== undefined) ) {
            const rIncrement = this.cellsize / 2;
            let radius = rIncrement;
            let direction = 1;
            for (const note of this.json.annotations as AnnotationBasic[]) {
                if ( (! ("type" in note)) || (note.type === undefined) ) {
                    throw new Error("Invalid annotation format found.");
                }
                const cloned = {...note};
                if ("targets" in cloned) {
                    // @ts-expect-error (only used to generate UUID)
                    delete cloned.targets;
                }

                if ( (note.type !== undefined) && (note.type === "move") ) {
                    if (note.targets.length < 2) {
                        throw new Error("Move annotations require at least two 'targets'.");
                    }

                    let colour = this.options.colourContext.annotations;
                    if ( ("colour" in note) && (note.colour !== undefined) && (note.colour !== null) ) {
                        colour = this.resolveColour(note.colour ) as string;
                    }
                    let style = "solid";
                    if ( ("style" in note) && (note.style !== undefined) ) {
                        style = note.style as string;
                    }
                    let arrow = true;
                    if ( ("arrow" in note) && (note.arrow !== undefined)) {
                        arrow = note.arrow;
                    }
                    let opacity = 1;
                    if ( ("opacity" in note) && (note.opacity !== undefined) ) {
                        opacity = note.opacity;
                    }
                    let strokeWidth = 0.03;
                    if ( ("strokeWidth" in note) && (note.strokeWidth !== undefined) ) {
                        strokeWidth = note.strokeWidth;
                    }
                    const unit = strokeWidth / 0.03;
                    const s = this.cellsize * strokeWidth / 2;
                    // const markerArrow = group.marker(5, 5, (add) => add.path("M 0 0 L 10 5 L 0 10 z"));
                    const markerArrow = group.marker(4 * unit + 3 * s, 4 * unit + 2 * s, (add) => add.path(`M${s},${s} L${s + 4 * unit},${s + 2 * unit} ${s},${s + 4 * unit} Z`).fill(colour)).attr({ 'pointer-events': 'none' }).addClass(`aprender-annotation-${x2uid(cloned)}`);
                    const markerCircle = group.marker(2 * unit + 2 * s, 2 * unit + 2 * s, (add) => add.circle(2 * unit).center(unit + s, unit + s).fill(colour)).attr({ 'pointer-events': 'none' }).addClass(`aprender-annotation-${x2uid(cloned)}`);
                    const points: string[] = [];
                    const tInverted = transform.inverse();
                    for (const node of (note.targets as ITarget[])) {
                        const entry = entries.find(e => e.col === node.col && e.row === node.row);
                        if (entry === undefined) {
                            throw new Error(`Annotation - Move: Could not find coordinates for row ${node.row}, column ${node.col}.`);
                        }
                        const inverted = tInverted.applyToPoint(entry.x, entry.y);
                        points.push(`${inverted.x},${inverted.y}`);
                    }
                    const stroke: StrokeData = {
                        color: colour,
                        opacity,
                        width: this.cellsize * strokeWidth,
                        linecap: "round", linejoin: "round"
                    };
                    if (style === "dashed") {
                        stroke.dasharray = (4 * Math.ceil(strokeWidth / 0.03)).toString();
                        if (note.dashed !== undefined && note.dashed !== null) {
                            stroke.dasharray = (note.dashed ).join(" ");
                        }
                    }
                    const line = group.polyline(points.join(" ")).addClass(`aprender-annotation-${x2uid(cloned)}`).stroke(stroke).fill("none").attr({ 'pointer-events': 'none' }).matrix(transform.toArray());
                    line.marker("start", markerCircle);
                    if (arrow) {
                        line.marker("end", markerArrow);
                    } else {
                        line.marker("end", markerCircle);
                    }
                } else if ( (note.type !== undefined) && (note.type === "eject") ) {
                    if (note.targets.length !== 2) {
                        throw new Error("Eject annotations require exactly two 'targets'.");
                    }

                    let colour = this.options.colourContext.annotations;
                    if ( ("colour" in note) && (note.colour !== undefined) ) {
                        colour = this.resolveColour(note.colour , "#000") as string;
                    }
                    let style = "dashed";
                    if ( ("style" in note) && (note.style !== undefined) ) {
                        style = note.style as string;
                    }
                    let arrow = false;
                    if ( ("arrow" in note) && (note.arrow !== undefined)) {
                        arrow = note.arrow;
                    }
                    let opacity = 0.5;
                    if ( ("opacity" in note) && (note.opacity !== undefined) ) {
                        opacity = note.opacity;
                    }

                    // const markerArrow = group.marker(5, 5, (add) => add.path("M 0 0 L 10 5 L 0 10 z"));
                    const markerArrow = group.marker(4, 4, (add) => add.path("M0,0 L4,2 0,4").fill(colour)).attr({ 'pointer-events': 'none' }).addClass(`aprender-annotation-${x2uid(cloned)}`);
                    const markerCircle = group.marker(2, 2, (add) => add.circle(2).fill(colour)).attr({ 'pointer-events': 'none' }).addClass(`aprender-annotation-${x2uid(cloned)}`);
                    const tInverted = transform.inverse();
                    const [from, to] = note.targets as ITarget[];
                    const entryFrom = entries.find(e => e.col === from.col && e.row === from.row);
                    if (entryFrom === undefined) {
                        throw new Error(`Annotation - Eject: Could not find coordinates for row ${from.row}, column ${from.col}.`);
                    }
                    const fromInverted = tInverted.applyToPoint(entryFrom.x, entryFrom.y);
                    const ptFrom = {x: fromInverted.x, y: fromInverted.y};
                    const entryTo = entries.find(e => e.col === to.col && e.row === to.row);
                    if (entryTo === undefined) {
                        throw new Error(`Annotation - Eject: Could not find coordinates for row ${to.row}, column ${to.col}.`);
                    }
                    const toInverted = tInverted.applyToPoint(entryTo.x, entryTo.y);
                    const ptTo = {x: toInverted.x, y: toInverted.y};
                    const ptCtr = this.getArcCentre(ptFrom, ptTo, radius * direction);
                    const stroke: StrokeData = {
                        color: colour,
                        opacity,
                        width: this.cellsize * 0.03,
                        linecap: "round", linejoin: "round"
                    };
                    if (style === "dashed") {
                        stroke.dasharray = "4";
                        if (note.dashed !== undefined && note.dashed !== null) {
                            stroke.dasharray = (note.dashed ).join(" ");
                        }
                    }
                    const line = group.path(`M ${ptFrom.x} ${ptFrom.y} C ${ptCtr.x} ${ptCtr.y} ${ptCtr.x} ${ptCtr.y} ${ptTo.x} ${ptTo.y}`).addClass(`aprender-annotation-${x2uid(cloned)}`).stroke(stroke).fill("none").attr({ 'pointer-events': 'none' });
                    line.marker("start", markerCircle).matrix(transform.toArray());
                    if (arrow) {
                        line.marker("end", markerArrow);
                    } else {
                        line.marker("end", markerCircle);
                    }
                    direction *= -1;
                    let fixed = false;
                    if ( ("static" in note) && (note.static !== undefined) && (typeof note.static === "boolean") ) {
                        fixed = note.static;
                    }
                    if (! fixed) {
                        if (direction > 0) {
                            radius += rIncrement;
                        }
                    }
                } else if ( (note.type !== undefined) && (note.type === "dots") ) {
                    let colour = this.options.colourContext.annotations;
                    if ( ("colour" in note) && (note.colour !== undefined) ) {
                        colour = this.resolveColour(note.colour ) as string;
                    }
                    let opacity = 1;
                    if ( ("opacity" in note) && (note.opacity !== undefined) ) {
                        opacity = note.opacity;
                    }
                    let diameter = 0.1;
                    if ( ("size" in note) && (note.size !== undefined) ) {
                        diameter = note.size;
                    }
                    for (const node of (note.targets as ITarget[])) {
                        const entry = entries.find(e => e.col === node.col && e.row === node.row);
                        if (entry === undefined) {
                            throw new Error(`Annotation - Dots: Could not find coordinates for row ${node.row}, column ${node.col}.`);
                        }
                        const pt = {x: entry.x, y: entry.y};
                        const tInverted = transform.inverse();
                        const ptInverted = tInverted.applyToPoint(pt.x, pt.y);
                        group.circle(this.cellsize * diameter)
                            .addClass(`aprender-annotation-${x2uid(cloned)}`)
                            .fill(colour)
                            .opacity(opacity)
                            .stroke({width: 0})
                            .center(ptInverted.x, ptInverted.y)
                            .matrix(transform.toArray())
                            .attr({ 'pointer-events': 'none' });
                    }
                }
            }
        }
    }

    private isoMark(group: SVGG, entry: PointEntry, transform: Matrix): void {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Object in an invalid state!");
        }

        if ( ("board" in this.json) && (this.json.board !== undefined) && ("markers" in this.json.board!) && (this.json.board.markers !== undefined) && (Array.isArray(this.json.board.markers)) && (this.json.board.markers.length > 0) ) {
            if ( (! ("style" in this.json.board)) || (this.json.board.style === undefined) ) {
                throw new Error("This `markBoard` function only works with renderers that include a `style` property.");
            }

            let baseStroke = 1;
            // let baseColour = this.options.colourContext.strokes;
            let baseOpacity = 1;
            if ( ("strokeWeight" in this.json.board) && (this.json.board.strokeWeight !== undefined) ) {
                baseStroke = this.json.board.strokeWeight;
            }
            // if ( ("strokeColour" in this.json.board) && (this.json.board.strokeColour !== undefined) ) {
            //     baseColour = this.json.board.strokeColour;
            // }
            if ( ("strokeOpacity" in this.json.board) && (this.json.board.strokeOpacity !== undefined) ) {
                baseOpacity = this.json.board.strokeOpacity;
            }

            for (const marker of this.json.board.markers) {
                const cloned = {...marker};
                if ("points" in cloned) {
                    // @ts-expect-error (cloned is only used to generate UUID)
                    delete cloned.points;
                }
                if ( (!("points" in marker)) || (marker.points.find(p => p.col === entry.col && p.row === entry.row) === undefined) ) {
                    continue;
                }
                if (marker.type === "dots") {
                    let isGradient = false;
                    let colour: string|SVGGradient = this.options.colourContext.fill;
                    if ( ("colour" in marker) && (marker.colour !== undefined) ) {
                        if (typeof marker.colour === "object") {
                            isGradient = true;
                        }
                        colour = this.resolveColour(marker.colour);
                    }
                    let opacity = baseOpacity;
                    if ( ("opacity" in marker) && (marker.opacity !== undefined) ) {
                        opacity = marker.opacity;
                    }
                    let diameter = 0.1;
                    if ( ("size" in marker) && (marker.size !== undefined) ) {
                        diameter = marker.size;
                    }
                    const pt = {x: entry.x, y: entry.y};
                    const tInverted = transform.inverse();
                    const ptInverted = tInverted.applyToPoint(pt.x, pt.y);
                    const dot = group.circle(this.cellsize * diameter)
                        .opacity(opacity)
                        .stroke({width: 0})
                        .center(ptInverted.x, ptInverted.y)
                        .matrix(transform.toArray())
                        .attr({ 'pointer-events': 'none' })
                        .addClass(`aprender-marker-${x2uid(cloned)}`);
                    if (isGradient) {
                        dot.fill(colour as SVGGradient);
                    } else {
                        dot.fill({color: colour, opacity} as FillData)
                    }
                } else if (marker.type === "flood") {
                    let isGradient = false;
                    let colour: string|SVGGradient = this.options.colourContext.fill;
                    if ( ("colour" in marker) && (marker.colour !== undefined) ) {
                        if (typeof marker.colour === "object") {
                            isGradient = true;
                        }
                        colour = this.resolveColour(marker.colour);
                    }
                    let opacity = 0.25;
                    if ( ("opacity" in marker) && (marker.opacity !== undefined) ) {
                        opacity = marker.opacity;
                    }
                    let floodEle: SVGCircle|SVGPolygon|SVGPath|undefined;
                    const cell = entry.poly;
                    // the following eslint and ts exceptions are due to poor SVGjs typing
                    switch (cell.type) {
                        case "circle":
                            floodEle = group.circle(cell.r * 2).addClass(`aprender-marker-${x2uid(cloned)}`).stroke({color: "none", width: baseStroke}).center(cell.cx, cell.cy).attr({ 'pointer-events': 'none' });
                            break;
                        case "poly":
                            floodEle = group.polygon(cell.points.map(pt => `${pt.x},${pt.y}`).join(" ")).addClass(`aprender-marker-${x2uid(cloned)}`).stroke({color: "none", width: baseStroke, linecap: "round", linejoin: "round"}).attr({ 'pointer-events': 'none' });
                            break;
                        case "path":
                            floodEle = group.path(cell.path).addClass(`aprender-marker-${x2uid(cloned)}`).stroke({color: "none", width: baseStroke, linecap: "round", linejoin: "round"}).attr({ 'pointer-events': 'none' });
                            break;
                    }
                    if (floodEle !== undefined) {
                        if (isGradient) {
                            floodEle.fill(colour as SVGGradient);
                        } else {
                            floodEle.fill({color: colour, opacity} as FillData);
                        }
                    }
                    if (marker.pulse !== undefined && floodEle !== undefined) {
                        floodEle
                            .animate({duration: marker.pulse, delay: 0, when: "now", swing: true} as TimeLike)

                            .during((t: number) => floodEle!.fill({opacity: t})).loop(undefined, true);
                    }
                }
            }
        }
    }
}
