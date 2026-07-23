
import { FillData, StrokeData, Svg, G as SVGG, Gradient as SVGGradient, Circle as SVGCircle, Polygon as SVGPolygon, Path as SVGPath, TimeLike, Symbol as SVGSymbol, Use } from "@svgdotjs/svg.js";
import { GridPoints, IPoint, IPolyCircle, IPolyPolygon, Poly } from "../grids/_base";
import { AnnotationBasic, APRenderRep, AreaKey, Colourfuncs, IsoPiece, MarkerEdge, RowCol } from "../schemas/schema";
import { IRendererOptionsIn, RendererBase } from "./_base";
import { circle2poly, deg2rad } from "../common/plotting";
import { Matrix } from "transformation-matrix-js";
import { generateCubes, CubeFaceFills } from "./isometric/cubes";
import { effectiveCubeYaw, permuteCubeFacesForProjection } from "./isometric/cubeOrientation";
import { generateCylinders } from "./isometric/cylinders";
import { generateCones } from "./isometric/cones";
import { generateHexes } from "./isometric/hexes";
import { generatePyramids } from "./isometric/pyramids";
import { resolvePyramidDims, isPyramidPiece } from "./isometric/pyramidDims";
import { cellBaseSortKey, compareCellSortKeys, compareDrawTaskSortKeys, computeCellSortKey, ISO_DRAW_LAYER_ANNOTATION, ISO_DRAW_LAYER_EDGE, ISO_DRAW_LAYER_FOOTPRINT, ISO_DRAW_LAYER_MARK, ISO_DRAW_LAYER_PIECE, ISO_DRAW_LAYER_SURFACE, IsoCellSortKey } from "./isometric/cellSort";
import { resolveDepthShadedPieceId } from "./isometric/depthPiece";
import { applyIsoPieceOverlays } from "./isometric/isoOverlayApply";
import { collectIsoOverlayGlyphs, assertIsoOverlayValid } from "./isometric/isoOverlayPiece";
import { IsoFaceGlyphComposer } from "./isometric/faceOverlays";
import { isoCellFootprint } from "./isometric/footprint";
import { parseIsoPiecesString } from "./isometric/piecesGrid";
import { activeEdgeSides, collectEdgeMarkerSegments, EdgeSide, isoEdgeLabelOutset } from "./isometric/edgeMarkers";
import { buildIsoProjectionMatrix, isoLabelTransform, mapBoardToScreen, projectedCellDepth, resolveIsoProjection, usesLayeredCellDraw } from "./isometric/projection";
import { isoShadeFace, isoShadeFaces, IsoFaceFills } from "./isometric/shading";
import { ensureIsoContactBlurFilter, isoContactShadow } from "./isometric/shadow";
import { isoSymbolDimensions, isoSymbolPlacement } from "./isometric/symbolPlacement";
import { IsoPiecesGrid, isMultiFaceCube, isoPieceHeight, parseStackEntry } from "./isometric/stack";
import { effectiveRotatedPiece, generateIsoLintelOrSpacer } from "./isometric/pieceSymbols";
import { boardHexOrientation, isSpacerPiece, parseLintelPiece } from "./isometric/lintels";
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
            case "heightmap-squares":
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
        const boardLocalPolys: Poly[][] = polys.map((row) =>
            row.map((poly) => {
                if (poly.type === "circle") {
                    return { ...poly };
                }
                if (poly.type === "poly") {
                    return { type: "poly" as const, points: poly.points.map((pt) => ({ x: pt.x, y: pt.y })) };
                }
                throw new Error(`Unsupported poly type for edge markers: ${poly.type}`);
            }),
        );

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

        const isoProjection = resolveIsoProjection(
            ("projection" in this.json.board && this.json.board.projection !== undefined)
                ? this.json.board.projection
                : "iso",
        );
        const tFinal = buildIsoProjectionMatrix(isoProjection);
        // "isometricize" the points and polys
        gridPoints = gridPoints.map(row => row = row.map(pt => tFinal.applyToPoint(pt.x, pt.y)));
        if (this.json.board.style === "squares" || this.json.board.style === "heightmap-squares" || this.json.board.style === "hex-of-hex") {
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
                case "heightmap-squares":
                case "squares":
                    generateCubes({
                        rootSvg: this.rootSvg,
                        projection: isoProjection,
                        heights: [height],
                        stroke: surfaceStroke,
                        fill: surfaceFills.top,
                        faceFills: surfaceFills,
                        idSymbol: id,
                        // Full top grid so N/E edges survive layered draw order (cabinet default is W+S only).
                        sides: usesLayeredCellDraw(isoProjection) ? ["N", "E", "S", "W"] : undefined,
                    })
                    break;
                case "hex-of-cir":
                    generateCylinders({rootSvg: this.rootSvg, projection: isoProjection, heights: [height], stroke: surfaceStroke, fill: surfaceFills.top, faceFills: surfaceFills, idSymbol: id})
                    break;
                case "hex-of-hex":
                    generateHexes({rootSvg: this.rootSvg, projection: isoProjection, heights: [height], stroke: surfaceStroke, fill: surfaceFills.top, faceFills: surfaceFills, idSymbol: id, orientation: numRotations % 2 === 0 ? Orientation.POINTY : Orientation.FLAT})
                    break;
                default:
                    throw new Error("Could not determine how to build the board surface.");
            }
        }

        // now load the custom legend
        let legend: IsoLegend|undefined;
        const faceComposer = this.createIsoFaceComposer();
        const overlayApplier = (idSymbol: string, pc: IsoPiece, effectiveYaw: number) => {
            applyIsoPieceOverlays({
                rootSvg: this.rootSvg!,
                idSymbol,
                pc,
                projection: isoProjection,
                effectiveYaw,
                numRotations,
                effPiece: effectiveRotatedPiece(pc.piece, numRotations) as string,
                composer: faceComposer,
            });
        };
        if (this.json.legend !== null && this.json.legend !== undefined) {
            legend = this.json.legend as IsoLegend;
            for (const pc of Object.values(legend)) {
                assertIsoOverlayValid(pc);
                this.preloadPatternsForGlyphs(collectIsoOverlayGlyphs(pc));
            }
            for (const [key, pc] of Object.entries(this.json.legend as IsoLegend)) {
                const effPiece = effectiveRotatedPiece(pc.piece, numRotations);

                // generate the pieces
                if (isMultiFaceCube(pc)) {
                    for (let y = 0; y < 4; y++) {
                        const visible = permuteCubeFacesForProjection(pc.faces, y, isoProjection);
                        const top = this.resolveColour(visible.top, "#000") as string;
                        const left = this.resolveColour(visible.left, "#000") as string;
                        const right = this.resolveColour(visible.right, "#000") as string;
                        const idSymbol = `${key}__y${y}`;
                        generateCubes({
                            rootSvg: this.rootSvg,
                            projection: isoProjection,
                            heights: [isoPieceHeight(pc)],
                            stroke: pieceStroke,
                            fill: {color: isoShadeFace(top, "top")},
                            faceFills: {
                                top: {color: isoShadeFace(top, "top")},
                                left: {color: isoShadeFace(left, "left")},
                                right: {color: isoShadeFace(right, "right")},
                            },
                            idSymbol,
                        });
                        this.finishLegendPieceOverlays(idSymbol, pc, pc.piece, y, numRotations, faceComposer, isoProjection);
                    }
                } else if (isSpacerPiece(pc.piece) || parseLintelPiece(pc.piece) !== null) {
                    if (!isSpacerPiece(pc.piece) && !("colour" in pc)) {
                        throw new Error(`Legend entry "${key}" is missing colour.`);
                    }
                    const spacerFill = { color: "transparent" };
                    const fills = isSpacerPiece(pc.piece)
                        ? { top: spacerFill, left: spacerFill, right: spacerFill }
                        : toFaceFillsData(isoShadeFaces(this.resolveColour((pc as { colour: string }).colour, "#000") as string));
                    generateIsoLintelOrSpacer({
                        rootSvg: this.rootSvg,
                        piece: pc.piece,
                        projection: isoProjection,
                        heights: [isoPieceHeight(pc)],
                        stroke: pieceStroke,
                        fill: fills.top,
                        faceFills: fills,
                        idSymbol: key,
                        numRotations,
                    });
                    if (!isSpacerPiece(pc.piece)) {
                        this.finishLegendPieceOverlays(key, pc, pc.piece, 0, numRotations, faceComposer, isoProjection);
                    }
                } else if (!("colour" in pc)) {
                    throw new Error(`Legend entry "${key}" is missing colour.`);
                } else if (effPiece === "cube") {
                    const fills = toFaceFillsData(isoShadeFaces(this.resolveColour(pc.colour, "#000") as string));
                    generateCubes({rootSvg: this.rootSvg, projection: isoProjection, heights: [isoPieceHeight(pc)], stroke: pieceStroke, fill: fills.top, faceFills: fills, idSymbol: key});
                    this.finishLegendPieceOverlays(key, pc, effPiece, 0, numRotations, faceComposer, isoProjection);
                } else if (effPiece === "cylinder") {
                    const fills = toFaceFillsData(isoShadeFaces(this.resolveColour(pc.colour, "#000") as string));
                    generateCylinders({rootSvg: this.rootSvg, projection: isoProjection, heights: [isoPieceHeight(pc)], stroke: pieceStroke, fill: fills.top, faceFills: fills, idSymbol: key});
                    this.finishLegendPieceOverlays(key, pc, effPiece, 0, numRotations, faceComposer, isoProjection);
                } else if (effPiece === "cone") {
                    const fills = toFaceFillsData(isoShadeFaces(this.resolveColour(pc.colour, "#000") as string));
                    generateCones({rootSvg: this.rootSvg, projection: isoProjection, heights: [isoPieceHeight(pc)], stroke: pieceStroke, fill: fills.top, faceFills: fills, idSymbol: key});
                } else if (effPiece === "pyramid" && isPyramidPiece(pc)) {
                    const base = this.resolveColour(pc.colour, "#000") as string;
                    generatePyramids({
                        rootSvg: this.rootSvg,
                        projection: isoProjection,
                        dims: [resolvePyramidDims(pc)],
                        stroke: pieceStroke,
                        fill: { color: base },
                        baseHex: base,
                        idSymbol: key,
                    });
                } else if (effPiece === "hexp" || effPiece === "hexf") {
                    const fills = toFaceFillsData(isoShadeFaces(this.resolveColour(pc.colour, "#000") as string));
                    generateHexes({rootSvg: this.rootSvg, projection: isoProjection, heights: [isoPieceHeight(pc)], stroke: pieceStroke, fill: fills.top, faceFills: fills, idSymbol: key, orientation: boardHexOrientation(numRotations)});
                    this.finishLegendPieceOverlays(key, pc, effPiece, 0, numRotations, faceComposer, isoProjection);
                } else {

                    throw new Error(`Unrecognized isoPiece type "${effPiece}"`);
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
                projection: isoProjection,
            });

        const cellSortKeys = new Map<string, IsoCellSortKey>();
        let minDepth = Infinity;
        let maxDepth = -Infinity;
        for (const entry of transformedPoints) {
            const key = sortKeyForEntry(entry);
            cellSortKeys.set(`${entry.row},${entry.col}`, key);
            minDepth = Math.min(minDepth, key.depth);
            maxDepth = Math.max(maxDepth, key.depth);
        }
        if (!Number.isFinite(minDepth)) {
            minDepth = 0;
            maxDepth = 0;
        }

        const depthShadeEnabled = !this.json.options?.includes("no-iso-depth-shade");
        const cellFootprintEnabled = !this.json.options?.includes("no-iso-cell-footprint");
        const layeredCellDraw = usesLayeredCellDraw(isoProjection);
        const edgeMarkerSides = activeEdgeSides(this.json.board.markers ?? []);
        const hasEdgeMarkers = edgeMarkerSides.size > 0;
        let edgeLabelOutset = 0;
        if (hasEdgeMarkers) {
            edgeLabelOutset = isoEdgeLabelOutset(strokeWeight);
        }

        if (layeredCellDraw) {
            type IsoDrawTask = { sortKey: IsoCellSortKey; draw: () => void };
            const drawTasks: IsoDrawTask[] = [];

            for (const entry of transformedPoints) {
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

                const baseKey = cellBaseSortKey(entry, isoProjection);
                const surfacePlacement = isoSymbolPlacement(this.cellsize, entry.x, entry.y, cell, 1);
                const anchorYAfterSurface = surfacePlacement.anchorY;
                const yLift = Math.abs(entry.yOrig - anchorYAfterSurface);
                const groundDepth = projectedCellDepth({ x: entry.x, y: entry.y }, isoProjection);

                drawTasks.push({
                    sortKey: { ...baseKey, depth: groundDepth, layer: ISO_DRAW_LAYER_SURFACE, topY: anchorYAfterSurface },
                    draw: () => {
                        entry.y = anchorYAfterSurface;
                        if (entry.poly.type === "poly") {
                            entry.poly.points = entry.poly.points.map(pt => ({ ...pt, y: pt.y - yLift }));
                        } else if (entry.poly.type === "circle") {
                            entry.poly.cy = entry.poly.cy - yLift;
                        }
                        const used = board.use(cell).move(surfacePlacement.newx, surfacePlacement.newy).size(surfacePlacement.newWidth, surfacePlacement.newHeight);
                        if (this.options.boardClick !== undefined) {
                            used.click((e: Event) => { this.options.boardClick!(entry.row, entry.col, ""); e.stopPropagation(); });
                        } else {
                            used.attr({ "pointer-events": "none" });
                        }
                    },
                });

                drawTasks.push({
                    sortKey: { ...baseKey, depth: groundDepth, layer: ISO_DRAW_LAYER_MARK, topY: anchorYAfterSurface },
                    draw: () => {
                        this.isoMark(board, entry, tFinal);
                        if (this.options.showAnnotations) {
                            this.preAnnotate(board, entry);
                        }
                    },
                });

                let stackAnchorY = anchorYAfterSurface;
                if (pieces !== undefined) {
                    const stack = pieces[entry.row]?.[entry.col] ?? [];
                    const hasPieces = stack.some((item) => {
                        const { glyph } = parseStackEntry(item);
                        return glyph !== "" && glyph !== "-";
                    });
                    if (cellFootprintEnabled && hasPieces) {
                        drawTasks.push({
                            sortKey: { ...baseKey, depth: groundDepth, layer: ISO_DRAW_LAYER_FOOTPRINT, topY: anchorYAfterSurface },
                            draw: () => {
                                isoCellFootprint(
                                    board,
                                    entry.poly,
                                    strokeColour,
                                    this.options.colourContext.background,
                                    this.cellsize,
                                );
                            },
                        });
                    }

                    for (const [idx, stackItem] of stack.entries()) {
                        const { glyph, yaw } = parseStackEntry(stackItem);
                        if (glyph === "" || glyph === "-") { continue; }
                        let pieceId = glyph;
                        if (legend !== undefined && legend[glyph] !== undefined && isMultiFaceCube(legend[glyph])) {
                            pieceId = `${glyph}__y${effectiveCubeYaw(yaw, boardRotation)}`;
                        }
                        const sortKey = cellSortKeys.get(`${entry.row},${entry.col}`);
                        if (depthShadeEnabled && legend !== undefined && sortKey !== undefined) {
                            pieceId = resolveDepthShadedPieceId({
                                rootSvg: this.rootSvg,
                                glyph,
                                pieceId,
                                yaw,
                                legend,
                                depth: sortKey.depth,
                                minDepth,
                                maxDepth,
                                numRotations,
                                projection: isoProjection,
                                pieceStroke,
                                resolveColour: (colour: string | number | Colourfuncs, fallback) =>
                                    this.resolveColour(colour, fallback) as string,
                                overlayApplier,
                            });
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
                        const pieceSymbol = piece;
                        const piecePlacement = isoSymbolPlacement(this.cellsize, entry.x, stackAnchorY, pieceSymbol, pcScale);
                        const pieceTopY = piecePlacement.anchorY;
                        stackAnchorY = pieceTopY;

                        drawTasks.push({
                            sortKey: {
                                ...baseKey,
                                depth: groundDepth,
                                layer: ISO_DRAW_LAYER_PIECE + idx * 0.01,
                                topY: pieceTopY,
                            },
                            draw: () => {
                                entry.y = pieceTopY;
                                if (!this.json!.options?.includes("no-piece-shadow") && idx === 0) {
                                    const dyBottom = parseFloat(pieceSymbol.attr("data-dy-bottom") as string);
                                    isoContactShadow(board, piecePlacement, dyBottom);
                                }
                                const used = board.use(pieceSymbol).move(piecePlacement.newx, piecePlacement.newy).size(piecePlacement.newWidth, piecePlacement.newHeight);
                                if ( (this.options.boardClick !== undefined) && (! this.json!.options?.includes("no-piece-click")) ) {
                                    used.click((e: Event) => { this.options.boardClick!(entry.row, entry.col, idx.toString()); e.stopPropagation(); });
                                } else {
                                    used.attr({ "pointer-events": "none" });
                                }
                            },
                        });
                    }
                }

                if (this.options.showAnnotations && this.dotsAnnotationTargets(entry.row, entry.col)) {
                    drawTasks.push({
                        sortKey: {
                            ...baseKey,
                            depth: groundDepth,
                            layer: ISO_DRAW_LAYER_ANNOTATION,
                            topY: stackAnchorY,
                        },
                        draw: () => {
                            entry.y = stackAnchorY;
                            this.drawCellDotsAnnotations(board, entry, tFinal, entry.row, entry.col);
                        },
                    });
                }
            }

            if (hasEdgeMarkers) {
                drawTasks.push({
                    sortKey: {
                        depth: minDepth,
                        topY: 0,
                        rotatedX: 0,
                        layer: ISO_DRAW_LAYER_EDGE,
                        row: -1,
                        col: -1,
                    },
                    draw: () => {
                        this.placeEdgeMarkers(board, boardLocalGrid, boardLocalPolys, tUserRotate, tFinal, strokeWeight);
                    },
                });
            }

            drawTasks.sort((a, b) => compareDrawTaskSortKeys(a.sortKey, b.sortKey));
            for (const task of drawTasks) {
                task.draw();
            }
        } else {
            transformedPoints.sort((a, b) => compareCellSortKeys(sortKeyForEntry(a), sortKeyForEntry(b)));

            for (const entry of transformedPoints) {
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
                const used = board.use(cell).move(surfacePlacement.newx, surfacePlacement.newy).size(surfacePlacement.newWidth, surfacePlacement.newHeight);
                if (this.options.boardClick !== undefined) {
                    used.click((e: Event) => { this.options.boardClick!(entry.row, entry.col, ""); e.stopPropagation(); });
                } else {
                    used.attr({ "pointer-events": "none" });
                }
                if (entry.poly.type === "poly") {
                    const newpts: IPoint[] = entry.poly.points.map(pt => ({ ...pt, y: pt.y - Math.abs(entry.yOrig - entry.y) }));
                    entry.poly.points = newpts;
                } else if (entry.poly.type === "circle") {
                    entry.poly.cy = entry.poly.cy - Math.abs(entry.yOrig - entry.y);
                }

                this.isoMark(board, entry, tFinal);

                if (this.options.showAnnotations) {
                    this.preAnnotate(board, entry);
                }

                if (pieces !== undefined) {
                    const stack = pieces[entry.row]?.[entry.col] ?? [];
                    const hasPieces = stack.some((item) => {
                        const { glyph } = parseStackEntry(item);
                        return glyph !== "" && glyph !== "-";
                    });
                    if (cellFootprintEnabled && hasPieces) {
                        isoCellFootprint(
                            board,
                            entry.poly,
                            strokeColour,
                            this.options.colourContext.background,
                            this.cellsize,
                        );
                    }
                }
            }

            if (hasEdgeMarkers) {
                this.placeEdgeMarkers(board, boardLocalGrid, boardLocalPolys, tUserRotate, tFinal, strokeWeight);
            }

            for (const entry of transformedPoints) {
                if (blocked !== undefined && blocked.find(b => b.row === entry.row && b.col === entry.col)) {
                    continue;
                }
                if (pieces !== undefined) {
                    const stack = pieces[entry.row]?.[entry.col] ?? [];
                    for (const [idx, stackItem] of stack.entries()) {
                        const { glyph, yaw } = parseStackEntry(stackItem);
                        if (glyph === "" || glyph === "-") { continue; }
                        let pieceId = glyph;
                        if (legend !== undefined && legend[glyph] !== undefined && isMultiFaceCube(legend[glyph])) {
                            pieceId = `${glyph}__y${effectiveCubeYaw(yaw, boardRotation)}`;
                        }
                        const sortKey = cellSortKeys.get(`${entry.row},${entry.col}`);
                        if (depthShadeEnabled && legend !== undefined && sortKey !== undefined) {
                            pieceId = resolveDepthShadedPieceId({
                                rootSvg: this.rootSvg,
                                glyph,
                                pieceId,
                                yaw,
                                legend,
                                depth: sortKey.depth,
                                minDepth,
                                maxDepth,
                                numRotations,
                                projection: isoProjection,
                                pieceStroke,
                                resolveColour: (colour: string | number | Colourfuncs, fallback) =>
                                    this.resolveColour(colour, fallback) as string,
                                overlayApplier,
                            });
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
                        if (!this.json.options?.includes("no-piece-shadow") && idx === 0) {
                            const dyBottom = parseFloat(piece.attr("data-dy-bottom") as string);
                            isoContactShadow(board, piecePlacement, dyBottom);
                        }
                        const used = board.use(piece).move(piecePlacement.newx, piecePlacement.newy).size(piecePlacement.newWidth, piecePlacement.newHeight);
                        if ( (this.options.boardClick !== undefined) && (! this.json!.options?.includes("no-piece-click")) ) {
                            used.click((e: Event) => { this.options.boardClick!(entry.row, entry.col, idx.toString()); e.stopPropagation(); });
                        } else {
                            used.attr({ "pointer-events": "none" });
                        }
                    }
                }
                if (this.options.showAnnotations && this.dotsAnnotationTargets(entry.row, entry.col)) {
                    this.drawCellDotsAnnotations(board, entry, tFinal, entry.row, entry.col);
                }
            }
        }

        if (!this.json.options?.includes("hide-labels")) {
            this.placeBoardLabels(board, boardLocalGrid, tUserRotate, tFinal, edgeMarkerSides, edgeLabelOutset);
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

    private placeEdgeMarkers(
        board: SVGG,
        boardLocalGrid: GridPoints,
        boardLocalPolys: Poly[][],
        tUserRotate: Matrix,
        tFinal: Matrix,
        baseStroke: number,
    ): void {
        if (this.json === undefined || this.json.board === null) {
            throw new Error("Invalid object state.");
        }
        if (!("style" in this.json.board) || this.json.board.style === undefined) {
            return;
        }
        const style = this.json.board.style;
        if (style !== "squares" && style !== "heightmap-squares" && style !== "hex-of-hex" && style !== "hex-of-cir") {
            return;
        }
        const markers = (this.json.board.markers ?? []).filter((m): m is MarkerEdge => m.type === "edge");
        if (markers.length === 0) {
            return;
        }

        let baseOpacity = 1;
        if ("strokeOpacity" in this.json.board && this.json.board.strokeOpacity !== undefined) {
            baseOpacity = this.json.board.strokeOpacity;
        }

        const edges = board.group().id("edge-markers").attr({ "pointer-events": "none" });

        for (const marker of markers) {
            const cloned = { ...marker };
            const segments = collectEdgeMarkerSegments(
                style,
                marker.edge,
                boardLocalGrid,
                boardLocalPolys,
                this.cellsize,
                baseStroke,
            );
            if (segments.length === 0) {
                continue;
            }

            let colour = this.options.colourContext.strokes;
            if ("colour" in marker && marker.colour !== undefined) {
                colour = this.resolveColour(marker.colour) as string;
            }
            let opacity = baseOpacity + ((1 - baseOpacity) / 2);
            if ("opacity" in marker && marker.opacity !== undefined) {
                opacity = marker.opacity;
            }

            const stroke: StrokeData = {
                width: baseStroke * 3,
                color: colour,
                opacity,
                linecap: "round",
                linejoin: "round",
            };

            for (const { x1, y1, x2, y2 } of segments) {
                const from = mapBoardToScreen(x1, y1, tUserRotate, tFinal);
                const to = mapBoardToScreen(x2, y2, tUserRotate, tFinal);
                edges
                    .line(from.x, from.y, to.x, to.y)
                    .addClass(`aprender-marker-${x2uid(cloned)}`)
                    .stroke(stroke);
            }
        }
    }

    private placeIsoLabel(labels: SVGG, text: string, localX: number, localY: number, tUserRotate: Matrix, tFinal: Matrix, colour: string, opacity: number): void {
        labels.text(text)
            .fill(colour)
            .opacity(opacity)
            .transform(isoLabelTransform(localX, localY, tUserRotate, tFinal))
            .attr({ "text-anchor": "middle", "dominant-baseline": "central" });
    }

    private placeBoardLabels(
        board: SVGG,
        boardLocalGrid: GridPoints,
        tUserRotate: Matrix,
        tFinal: Matrix,
        edgeSides: Set<EdgeSide> = new Set(),
        edgeLabelOutset = 0,
    ): void {
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
        const nOutset = edgeSides.has("N") ? edgeLabelOutset : 0;
        const sOutset = edgeSides.has("S") ? edgeLabelOutset : 0;
        const eOutset = edgeSides.has("E") ? edgeLabelOutset : 0;
        const wOutset = edgeSides.has("W") ? edgeLabelOutset : 0;
        const neOutset = edgeSides.has("NE") ? edgeLabelOutset : 0;
        const seOutset = edgeSides.has("SE") ? edgeLabelOutset : 0;
        const swOutset = edgeSides.has("SW") ? edgeLabelOutset : 0;
        const nwOutset = edgeSides.has("NW") ? edgeLabelOutset : 0;

        switch (this.json.board.style) {
            case "heightmap-squares":
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
                    const flatTop = {x: boardLocalGrid[0][col].x, y: boardLocalGrid[0][col].y - cellsize - nOutset};
                    const flatBottom = {x: boardLocalGrid[boardHeight - 1][col].x, y: boardLocalGrid[boardHeight - 1][col].y + cellsize + sOutset};
                    if (!hideHalf) {
                        this.placeIsoLabel(labels, columnLabels[col], flatTop.x, flatTop.y, tUserRotate, tFinal, labelColour, labelOpacity);
                    }
                    this.placeIsoLabel(labels, columnLabels[col], flatBottom.x, flatBottom.y, tUserRotate, tFinal, labelColour, labelOpacity);
                }
                for (let row = 0; row < boardHeight; row++) {
                    const flatL = {x: boardLocalGrid[row][0].x - cellsize - wOutset, y: boardLocalGrid[row][0].y};
                    const flatR = {x: boardLocalGrid[row][width - 1].x + cellsize + eOutset, y: boardLocalGrid[row][width - 1].y};
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
                    const hexRowOutsetL = nwOutset + swOutset;
                    const hexRowOutsetR = neOutset + seOutset;
                    const flatL = {x: boardLocalGrid[row][0].x - cellsize - wOutset - hexRowOutsetL, y: boardLocalGrid[row][0].y};
                    const flatR = {
                        x: boardLocalGrid[row][boardLocalGrid[row].length - 1].x + cellsize + eOutset + hexRowOutsetR,
                        y: boardLocalGrid[row][boardLocalGrid[row].length - 1].y,
                    };
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

    private dotsAnnotationTargets(row: number, col: number): boolean {
        if (this.json === undefined || !("annotations" in this.json) || this.json.annotations === undefined) {
            return false;
        }
        return (this.json.annotations as AnnotationBasic[]).some(
            (note) => note.type === "dots"
                && Array.isArray(note.targets)
                && (note.targets as ITarget[]).some((t) => t.row === row && t.col === col),
        );
    }

    private drawCellDotsAnnotations(group: SVGG, entry: PointEntry, transform: Matrix, row: number, col: number): void {
        if (this.json === undefined || this.rootSvg === undefined) {
            throw new Error("Object in an invalid state!");
        }
        if (!("annotations" in this.json) || this.json.annotations === undefined) {
            return;
        }

        for (const note of this.json.annotations as AnnotationBasic[]) {
            if (note.type !== "dots" || !Array.isArray(note.targets)) {
                continue;
            }
            const targets = (note.targets as ITarget[]).filter((t) => t.row === row && t.col === col);
            if (targets.length === 0) {
                continue;
            }

            const cloned = { ...note };
            if ("targets" in cloned) {
                // @ts-expect-error (only used to generate UUID)
                delete cloned.targets;
            }

            let colour = this.options.colourContext.annotations;
            if (("colour" in note) && note.colour !== undefined) {
                colour = this.resolveColour(note.colour) as string;
            }
            let opacity = 1;
            if (("opacity" in note) && note.opacity !== undefined) {
                opacity = note.opacity;
            }
            let diameter = 0.1;
            if (("size" in note) && note.size !== undefined) {
                diameter = note.size;
            }

            const pt = { x: entry.x, y: entry.y };
            const tInverted = transform.inverse();
            const ptInverted = tInverted.applyToPoint(pt.x, pt.y);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for (const _node of targets) {
                group.circle(this.cellsize * diameter)
                    .addClass(`aprender-annotation-${x2uid(cloned)}`)
                    .fill(colour)
                    .opacity(opacity)
                    .stroke({ width: 0 })
                    .center(ptInverted.x, ptInverted.y)
                    .matrix(transform.toArray())
                    .attr({ "pointer-events": "none" });
            }
        }
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

    private createIsoFaceComposer(): IsoFaceGlyphComposer {
        return (glyphs, ctx) => {
            const face = this.rootSvg!.defs().nested();
            this.composeGlyphsLayer(face as unknown as Svg, glyphs, {
                legendKey: `iso_${ctx.faceKey}_${ctx.hostSymbolId}`,
                cellsize: ctx.localW,
                layout: "isoFace",
                faceInset: ctx.faceInset,
                faceLocalW: ctx.localW,
                faceLocalH: ctx.localH,
                counterRotateWithBoard: ctx.counterRotateWithBoard,
                maxSquareSide: ctx.maxSquareSide,
            });
            return face;
        };
    }

    private finishLegendPieceOverlays(
        idSymbol: string,
        pc: IsoPiece,
        effPiece: string,
        effectiveYaw: number,
        numRotations: number,
        composer: IsoFaceGlyphComposer,
        projection: ReturnType<typeof resolveIsoProjection>,
    ): void {
        applyIsoPieceOverlays({
            rootSvg: this.rootSvg!,
            idSymbol,
            pc,
            projection,
            effectiveYaw,
            numRotations,
            effPiece,
            composer,
        });
    }
}
