import { FillData, StrokeData, Svg, G as SVGG, Gradient as SVGGradient, Circle as SVGCircle, Polygon as SVGPolygon, Path as SVGPath, TimeLike } from "@svgdotjs/svg.js";
import { GridPoints, IPoint, IPolyCircle, IPolyPolygon, Poly } from "../grids/_base";
import { AnnotationBasic, APRenderRep, IsoPiece } from "../schemas/schema";
import { IRendererOptionsIn, RendererBase } from "./_base";
import { circle2poly, deg2rad } from "../common/plotting";
import { Matrix } from "transformation-matrix-js";
import { generateCubes } from "./isometric/cubes";
import { generateCylinders } from "./isometric/cylinders";
import { generateHexes } from "./isometric/hexes";
import { x2uid } from "../common/glyph2uid";
import { Orientation } from "honeycomb-grid";

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

        let basePcScale = 1;
        switch (this.json.board.style) {
            case "squares":
                [gridPoints, polys] = this.squares({noSvg: true});
                break;
            case "hex-of-hex":
                [gridPoints, polys] = this.hexOfHex({noSvg: true});
                basePcScale = 0.85;
                break;
            case "hex-of-cir":
                [gridPoints, polys] = this.hexOfCir({noSvg: true});
                basePcScale = 0.85;
                break;
            default:
                throw new Error(`The requested board style (${ this.json.board.style }) is not supported by the '${ IsometricRenderer.rendererName }' renderer.`);
        }

        let board = this.rootSvg.findOne("#board") as SVGG;
        if (board === null) {
            board = this.rootSvg.group().id("board");
        }
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
        for (const height of allHeights) {
            const id = `_surface_${height.toString().replace(".", "_")}`;
            switch (this.json.board.style) {
                case "squares":
                    generateCubes({rootSvg: this.rootSvg, heights: [height], stroke: {width: strokeWeight, color: strokeColour, opacity: strokeOpacity}, fill: {color: this.options.colourContext.background}, idSymbol: id})
                    break;
                case "hex-of-cir":
                    generateCylinders({rootSvg: this.rootSvg, heights: [height], stroke: {width: strokeWeight, color: strokeColour, opacity: strokeOpacity}, fill: {color: this.options.colourContext.background}, idSymbol: id})
                    break;
                case "hex-of-hex":
                    generateHexes({rootSvg: this.rootSvg, heights: [height], stroke: {width: strokeWeight, color: strokeColour, opacity: strokeOpacity}, fill: {color: this.options.colourContext.background}, idSymbol: id, orientation: Orientation.POINTY})
                    break;
                default:
                    throw new Error("Could not determine how to build the board surface.");
            }
        }

        // now load the custom legend
        type MyLegend = {[k: string]: IsoPiece};
        let legend: MyLegend|undefined;
        if (this.json.legend !== null && this.json.legend !== undefined) {
            legend = this.json.legend as MyLegend;
            for (const [key, pc] of Object.entries(this.json.legend as MyLegend)) {
                if (pc.piece === "cube") {
                    generateCubes({rootSvg: this.rootSvg, heights: [pc.height], stroke: {width: strokeWeight, color: strokeColour, opacity: strokeOpacity}, fill: {color: this.resolveColour(pc.colour, "#000") as string}, idSymbol: key});
                } else if (pc.piece === "cylinder") {
                    generateCylinders({rootSvg: this.rootSvg, heights: [pc.height], stroke: {width: strokeWeight, color: strokeColour, opacity: strokeOpacity}, fill: {color: this.resolveColour(pc.colour, "#000") as string}, idSymbol: key});
                } else if (pc.piece === "hexp") {
                    generateHexes({rootSvg: this.rootSvg, heights: [pc.height], stroke: {width: strokeWeight, color: strokeColour, opacity: strokeOpacity}, fill: {color: this.resolveColour(pc.colour, "#000") as string}, idSymbol: key, orientation: Orientation.POINTY})
                } else if (pc.piece === "hexf") {
                    generateHexes({rootSvg: this.rootSvg, heights: [pc.height], stroke: {width: strokeWeight, color: strokeColour, opacity: strokeOpacity}, fill: {color: this.resolveColour(pc.colour, "#000") as string}, idSymbol: key, orientation: Orientation.FLAT})
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

        // now place the surface components and any pieces on top of them, one cell at a time
        for (const entry of transformedPoints) {
            let height = 0;
            if (heightmap !== undefined && heightmap.length >= entry.row + 1 && heightmap[entry.row].length >= entry.col + 1) {
                height = heightmap[entry.row][entry.col];
            }
            const idHeight = height.toString().replace(".", "_");
            const cell = this.rootSvg.findOne(`#_surface_${idHeight}`) as Svg;
            if ( (cell === null) || (cell === undefined) ) {
                throw new Error(`Could not find the requested cube of height ${idHeight}.`);
            }
            let widthRatio = parseFloat(cell.attr("data-width-ratio") as string);
            let heightRatio: number|undefined;
            if (cell.attr("data-height-ratio") !== undefined) {
                heightRatio = parseFloat(cell.attr("data-height-ratio") as string);
            }
            let factor = this.cellsize / cell.viewbox().width * widthRatio;
            let factorHeight: number|undefined;
            if (heightRatio !== undefined) {
                factorHeight = this.cellsize / cell.viewbox().height * heightRatio;
            }
            let newWidth = factor * cell.viewbox().width;
            let newHeight = factor * cell.viewbox().height;
            if (factorHeight !== undefined) {
                newHeight = factorHeight * cell.viewbox().height;
            }
            let dyBottom = parseFloat(cell.attr("data-dy-bottom") as string) * newHeight;
            let newx = entry.x - (newWidth / 2);
            let newy = entry.y - dyBottom;
            let dyTop = parseFloat(cell.attr("data-dy-top") as string) * newHeight;
            entry.y = newy + dyTop;
            let used = board.use(cell).move(newx, newy).size(newWidth, newHeight);
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
                const stack = pieces[entry.row][entry.col];
                for (const [idx, pc] of stack.entries()) {
                    if (pc === "" || pc === "-") { continue; }
                    const piece = this.rootSvg.findOne("#" + pc) as Svg;
                    if ( (piece === null) || (piece === undefined) ) {
                        throw new Error(`Could not find the requested piece (${pc}). Each piece in the \`pieces\` property *must* exist in the \`legend\`.`);
                    }
                    widthRatio = parseFloat(piece.attr("data-width-ratio") as string);
                    heightRatio = undefined;
                    if (piece.attr("data-height-ratio") !== undefined) {
                        heightRatio = parseFloat(piece.attr("data-height-ratio") as string);
                    }
                    let pcScale = 0.75;
                    if (legend !== undefined && pc in legend && "scale" in legend[pc] && legend[pc].scale !== undefined) {
                        pcScale = legend[pc].scale as number;
                    }
                    pcScale *= basePcScale;
                    factor = this.cellsize / piece.viewbox().width * widthRatio * pcScale;
                    factorHeight = undefined;
                    if (heightRatio !== undefined) {
                        factorHeight = this.cellsize / piece.viewbox().height * heightRatio;
                    }
                    newWidth = factor * piece.viewbox().width;
                    newHeight = factor * piece.viewbox().height;
                    if (factorHeight !== undefined) {
                        newHeight = factorHeight * piece.viewbox().height;
                    }
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
                    // This exception is fine because cloned is only used
                    // to create a UUID.
                    // @ts-expect-error
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
                    // This exception is fine because cloned is only used
                    // to create a UUID.
                    // @ts-expect-error
                    delete cloned.targets;
                }

                if ( (note.type !== undefined) && (note.type === "move") ) {
                    if ((note.targets as any[]).length < 2) {
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
                    for (const node of (note.targets as ITarget[])) {
                        const entry = entries.find(e => e.col === node.col && e.row === node.row);
                        if (entry === undefined) {
                            throw new Error(`Annotation - Move: Could not find coordinates for row ${node.row}, column ${node.col}.`);
                        }
                        points.push(`${entry.x},${entry.y}`);
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
                    const line = group.polyline(points.join(" ")).addClass(`aprender-annotation-${x2uid(cloned)}`).stroke(stroke).fill("none").attr({ 'pointer-events': 'none' });
                    line.marker("start", markerCircle);
                    if (arrow) {
                        line.marker("end", markerArrow);
                    } else {
                        line.marker("end", markerCircle);
                    }
                } else if ( (note.type !== undefined) && (note.type === "eject") ) {
                    if ((note.targets as any[]).length !== 2) {
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
                    const [from, to] = note.targets as ITarget[];
                    const entryFrom = entries.find(e => e.col === from.col && e.row === from.row);
                    if (entryFrom === undefined) {
                        throw new Error(`Annotation - Ejenct: Could not find coordinates for row ${from.row}, column ${from.col}.`);
                    }
                    const ptFrom = {x: entryFrom.x, y: entryFrom.y};
                    const entryTo = entries.find(e => e.col === to.col && e.row === to.row);
                    if (entryTo === undefined) {
                        throw new Error(`Annotation - Eject: Could not find coordinates for row ${to.row}, column ${to.col}.`);
                    }
                    const ptTo = {x: entryTo.x, y: entryTo.y};
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
                    line.marker("start", markerCircle);
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
                        const tInverted = transform.inverse(false, false);
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
                const cloned = {...marker as {[k:string]: any}};
                if ("points" in cloned) {
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
                    const tInverted = transform.inverse(false, false);
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
                            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
                            .during((t: number) => floodEle!.fill({opacity: t})).loop(undefined, true);
                    }
                }
            }
        }
    }

}
