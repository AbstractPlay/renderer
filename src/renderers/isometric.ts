import { Svg, G as SVGG } from "@svgdotjs/svg.js";
import { GridPoints, IPoint, IPolyPolygon, Poly } from "../grids/_base";
import { APRenderRep, IsoPiece } from "../schemas/schema";
import { IRendererOptionsIn, RendererBase } from "./_base";
import { deg2rad } from "../common/plotting";
import { Matrix } from "transformation-matrix-js";
import { generateCubes } from "./isometric/cubes";
import { generateCylinders } from "./isometric/cylinders";

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
        if (! ("style" in this.json.board)) {
            throw new Error(`This 'board' schema cannot be handled by the '${ IsometricRenderer.rendererName }' renderer.`);
        }

        // In this renderer, the legend is bespoke and glyphs are rendered on the fly
        // // Load all the pieces in the legend (have to do this early so the glyphs are available for marking the board)
        // this.loadLegend();

        switch (this.json.board.style) {
            case "squares":
                [gridPoints, polys] = this.squares();
                break;
            default:
                throw new Error(`The requested board style (${ this.json.board.style }) is not supported by the '${ IsometricRenderer.rendererName }' renderer.`);
        }

        const board = this.rootSvg.findOne("#board") as SVGG;
        // any user-specified rotation has to happen before laying everything out
        if (this.options.rotate !== undefined) {
            // ensure it's a multiple of 90
            const extraRotation = 90 * Math.floor(this.options.rotate / 90);
            if (extraRotation !== 0) {
                // the points and polys
                const tUserRotate = new Matrix().rotate(deg2rad(extraRotation));
                gridPoints = gridPoints.map(row => row = row.map(pt => tUserRotate.applyToPoint(pt.x, pt.y)));
                polys = (polys as IPolyPolygon[][]).map(row => row = row.map(poly => poly = {...poly, points: poly.points.map(pt => tUserRotate.applyToPoint(pt.x, pt.y))} as IPolyPolygon));
            }
        }

        let strokeWeight = 1;
        if ("strokeWeight" in this.json.board && this.json.board.strokeWeight !== undefined) {
            strokeWeight = this.json.board.strokeWeight;
        }
        let strokeColour = this.options.colourContext.strokes;
        if ("strokeColour" in this.json.board && this.json.board.strokeColour !== undefined) {
            strokeColour = this.json.board.strokeColour;
        }
        let strokeOpacity = 1;
        if ("strokeOpacity" in this.json.board && this.json.board.strokeOpacity !== undefined) {
            strokeOpacity = this.json.board.strokeOpacity;
        }

        const tScale = new Matrix().scaleY(Math.cos(deg2rad(30)));
        const tShear = new Matrix().shearX(Math.tan(deg2rad(-30)));
        const tRotate = new Matrix().rotate(deg2rad(30));
        const tFinal = tRotate.multiply(tShear.multiply(tScale));
        if (this.json.board.style === "squares") {
            // delete gridlines, labels, and tiles
            const gridlines = this.rootSvg.findOne(`#gridlines`) as SVGG;
            gridlines.remove();
            const tiles = this.rootSvg.findOne(`#tiles`) as SVGG;
            tiles.remove();
            const labels = this.rootSvg.findOne(`#labels`) as SVGG;
            labels.remove();
            // "isometricize" the points and polys
            gridPoints = gridPoints.map(row => row = row.map(pt => tFinal.applyToPoint(pt.x, pt.y)));
            polys = (polys as IPolyPolygon[][]).map(row => row = row.map(poly => poly = {...poly, points: poly.points.map(pt => tFinal.applyToPoint(pt.x, pt.y))} as IPolyPolygon));
        }

        // sort the points in order of top to bottom, left to right
        // to ensure that everything overlaps appropriately
        type PointEntry = {
            col: number;
            row: number;
            x: number;
            y: number;
            xOrig: number;
            yOrig: number;
        };
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
                });
            }
        }
        transformedPoints.sort((a,b) => {
            if (Math.round(a.y) === Math.round(b.y)) {
                return Math.round(a.x) - Math.round(b.x);
            } else {
                return Math.round(a.y) - Math.round(b.y);
            }
        });

        // build the board, looking at the heightmap if provided
        // first generate the height cubes
        let heightmap: number[][]|undefined;
        let allHeights: number[] = [0];
        if ("heightmap" in this.json.board && this.json.board.heightmap !== undefined) {
            heightmap = this.json.board.heightmap;
            allHeights = [...new Set(heightmap.flat()).values()];
        }
        generateCubes({rootSvg: this.rootSvg, heights: allHeights, stroke: {width: strokeWeight, color: strokeColour, opacity: strokeOpacity}, fill: {color: this.options.colourContext.background}});

        // now load the custom legend
        type MyLegend = {[k: string]: IsoPiece};
        if (this.json.legend !== null && this.json.legend !== undefined) {
            for (const [key, pc] of Object.entries(this.json.legend as MyLegend)) {
                if (pc.piece === "cube") {
                    generateCubes({rootSvg: this.rootSvg, heights: [pc.height], stroke: {width: strokeWeight, color: strokeColour, opacity: strokeOpacity}, fill: {color: this.resolveColour(pc.colour, "#000") as string}, idSymbol: key});
                } else if (pc.piece === "cylinder") {
                    generateCylinders({rootSvg: this.rootSvg, heights: [pc.height], stroke: {width: strokeWeight, color: strokeColour, opacity: strokeOpacity}, fill: {color: this.resolveColour(pc.colour, "#000") as string}, idSymbol: key});
                } else {
                    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                    throw new Error(`Unrecognized isoPiece type "${pc.piece}"`);
                }
            }
        }

        // initialize the list of pieces
        let pieces: string[][][]|undefined;
        if (this.json.pieces !== null) {
            pieces = [];
            if (typeof this.json.pieces === "string") {
                // Does it contain commas
                if (this.json.pieces.indexOf(",") >= 0) {
                    for (const row of this.json.pieces.split("\n")) {
                        let node: string[][] = [];
                        if (row === "_") {
                            node = new Array(this.json.board.width).fill([]) as string[][];
                        } else {
                            const cells = row.split(",");
                            for (const cell of cells) {
                                if (cell === "") {
                                    node.push([]);
                                } else {
                                    node.push([...cell]);
                                }
                            }
                        }
                        pieces.push(node);
                    }
                } else {
                    throw new Error("This renderer requires that you use the comma-delimited or array format of the `pieces` property.");
                }
            } else if ( (this.json.pieces instanceof Array) && (this.json.pieces[0] instanceof Array) && (this.json.pieces[0][0] instanceof Array) ) {
                pieces = this.json.pieces as string[][][];
            } else {
                throw new Error("Unrecognized `pieces` property.");
            }
        }

        // now place the cubes and any pieces on top of them, one cell at a time
        // const group = board.group().id("pieces");
        // const surface = board.group().id("surface");
        for (const entry of transformedPoints) {
            let height = 0;
            if (heightmap !== undefined && heightmap.length >= entry.row + 1 && heightmap[entry.row].length >= entry.col + 1) {
                height = heightmap[entry.row][entry.col];
            }
            let idHeight = height.toString();
            while (idHeight.length < 3) {
                idHeight = "0" + idHeight;
            }
            const cube = this.rootSvg.findOne(`#_isoCube_${idHeight}`) as Svg;
            if ( (cube === null) || (cube === undefined) ) {
                throw new Error(`Could not find the requested cube of height ${idHeight}.`);
            }
            let widthRatio = parseFloat(cube.attr("data-width-ratio") as string);
            let factor = this.cellsize / cube.viewbox().width * widthRatio;
            let newWidth = factor * cube.viewbox().width;
            let newHeight = factor * cube.viewbox().height;
            let dyBottom = parseFloat(cube.attr("data-dy-bottom") as string) * newHeight;
            let newx = entry.x - (newWidth / 2);
            let newy = entry.y - dyBottom;
            let dyTop = parseFloat(cube.attr("data-dy-top") as string) * newHeight;
            entry.y = newy + dyTop;
            let used = board.use(cube).move(newx, newy).size(newWidth, newHeight);
            if (this.options.boardClick !== undefined) {
                used.click((e : Event) => {this.options.boardClick!(entry.row, entry.col, ""); e.stopPropagation();});
            } else {
                used.attr({"pointer-events": "none"});
            }
            // move polys so they are at the correct height
            const newpts: IPoint[] = (polys[entry.row][entry.col] as IPolyPolygon).points.map(pt => {return {...pt, y: pt.y - Math.abs(entry.yOrig - entry.y)}});
            (polys[entry.row][entry.col] as IPolyPolygon).points = newpts;

            // place any pieces that belong on this cell
            if (pieces !== undefined) {
                const stack = pieces[entry.row][entry.col];
                for (const [idx, pc] of stack.entries()) {
                    if (pc === "" || pc === "-") { continue; }
                    const piece = this.rootSvg.findOne("#" + pc) as Svg;
                    if ( (piece === null) || (piece === undefined) ) {
                        throw new Error(`Could not find the requested piece (${pc}). Each piece in the \`pieces\` property *must* exist in the \`legend\`.`);
                    }
                    widthRatio = parseFloat(piece.attr("data-width-ratio") as string);
                    factor = this.cellsize / piece.viewbox().width * widthRatio * 0.75;
                    newWidth = factor * piece.viewbox().width;
                    newHeight = factor * piece.viewbox().height;
                    dyBottom = parseFloat(piece.attr("data-dy-bottom") as string) * newHeight;
                    newx = entry.x - (newWidth / 2);
                    newy = entry.y - dyBottom;
                    dyTop = parseFloat(piece.attr("data-dy-top") as string) * newHeight;
                    entry.y = newy + dyTop;
                    used = board.use(piece).move(newx, newy).size(newWidth, newHeight);
                    if ( (this.options.boardClick !== undefined) && (! this.json.options?.includes("no-piece-click")) ) {
                        used.click((e : Event) => {this.options.boardClick!(entry.row, entry.col, idx.toString()); e.stopPropagation();});
                    } else {
                        used.attr({"pointer-events": "none"});
                    }
                }
            }
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

        // annotations
        if (this.options.showAnnotations) {
            this.annotateBoard(gridPoints, polys);
        }

        // if there's a board backfill, it needs to be done before rotation
        const backfilled = this.backFill(polys, true);

        // const box = this.rotateBoard();
        const box = board.rbox(this.rootSvg);

        // `pieces` area, if present
        this.piecesArea(box);

        // button bar
        this.placeButtonBar(box);

        // key
        this.placeKey(box);

        if (!backfilled) {
            this.backFill(polys);
        }
    }
}
