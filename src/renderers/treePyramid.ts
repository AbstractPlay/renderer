import { Svg } from "@svgdotjs/svg.js";
import { IPoint } from "../grids/_base";
import { AnnotationTree, APRenderRep, PiecesTree, TreeNode } from "../schemas/schema";
import { x2uid } from "../common/glyph2uid";
import { IRendererOptionsIn, RendererBase} from "./_base";
import { projectPoint, usePieceAt } from "../common/plotting";

/**
 * This is the default renderer used for most games.
 *
 */
export class TreePyramidRenderer extends RendererBase {

    public static readonly rendererName: string = "tree-pyramid";

    public render(json: APRenderRep, draw: Svg, options: IRendererOptionsIn): void {
        this.jsonPrechecks(json);
        if (this.json === undefined) {
            throw new Error("JSON prechecks fatally failed.");
        }
        this.optionsPrecheck(options);
        this.rootSvg = draw;

        // Delegate to style-specific renderer
        if (this.json.board !== null) {
            throw new Error("For this renderer, the board must be null.");
        }

        // Load all the pieces in the legend (have to do this first so the glyphs are available for marking the board)
        this.loadLegend();

        // parse the pieces array
        // first row are the root nodes, and then each row are the children of the previous nodes
        const pieces: TreeNode[][] = [];
        if (this.json.pieces !== null) {
            if (!Array.isArray(this.json.pieces) || typeof this.json.pieces[0] !== "object" || !("id" in this.json.pieces[0]) || !("parents" in this.json.pieces[0])) {
                throw new Error("Malformed `pieces` property. Must adhere to the `piecesTree` schema.");
            }
            // find root nodes first
            const roots = (this.json.pieces as PiecesTree).filter(n => n.parents === null);
            pieces.push([...roots]);
            while (pieces.flat().length < this.json.pieces.length) {
                const currIds = new Set<string>(pieces[pieces.length - 1].map(n => n.id));
                const children = (this.json.pieces as PiecesTree).filter(n => n.parents?.some(p => currIds.has(p)));
                // if none were found, then an error has happened somewhere
                if (children.length === 0) {
                    throw new Error("An error occurred while processing tree nodes.");
                }
                pieces.push([...children]);
            }
        }

        // create the field
        const ox = 0;
        const oy = 0
        const bgcolour = this.options.colourContext.background;
        const bgopacity = 1;
        const borderBuffer = 5;
        const padding = 5;
        const width = (pieces[0].length * this.cellsize) + ((pieces[0].length - 1) * padding) + (borderBuffer * 2);
        const height = (pieces.length * this.cellsize) + ((pieces.length - 1) * padding) + (borderBuffer * 2);
        const field = this.rootSvg.nested().id("board").viewbox(ox - borderBuffer, oy - borderBuffer, width + (borderBuffer*2), height + (borderBuffer*2)).move(ox, oy);
        field.rect(width, height).id("aprender-backfill").move(ox, oy).fill({color: bgcolour, opacity: bgopacity}).back();
        // background isn't clickable
        // if (this.options.boardClick !== undefined) {
        //     const originX = field.x() as number;
        //     const originY = field.y() as number;
        //     const genericCatcher = ((e: { clientX: number; clientY: number; }) => {
        //         const point = field.point(e.clientX, e.clientY);
        //         this.options.boardClick!(point.y - originY, point.x - originX, "_field");
        //     });
        //     field.click(genericCatcher);
        // }

        // Place the pieces according to the grid
        const xStart = ox + this.cellsize / 2;
        const yStart = oy + this.cellsize / 2;
        const node2xy = new Map<string, IPoint>();
        for (const row of pieces) {
            for (const node of row) {
                let x: number;
                let y: number;
                // handle root nodes first
                if (node.parents === null) {
                    const col = node2xy.size;
                    x = xStart + (col * (this.cellsize + padding));
                    y = yStart;
                }
                // then children
                else {
                    const parents = node.parents.map(n => node2xy.get(n));
                    if (parents.includes(undefined)) {
                        throw new Error(`Could not find x,y coordinates for a parent of node ${node.id}`);
                    }
                    x = parents.reduce((acc, curr) => acc + curr!.x, 0) / parents.length;
                    y = parents[0]!.y + this.cellsize + padding;
                }
                node2xy.set(node.id, {x, y});

                let pcid = node.id;
                if ( ("glyph" in node) && (node.glyph !== undefined) ) {
                    pcid = node.glyph;
                }
                const piece = this.rootSvg.findOne("#" + pcid) as Svg;
                if ( (piece === null) || (piece === undefined) ) {
                    throw new Error(`Could not find the requested piece (${pcid}). Each piece in the \`pieces\` property *must* exist in the \`legend\`.`);
                }
                const scalingFactor = 0.95;
                const use = usePieceAt({svg: field, piece, cellsize: this.cellsize, x, y, scalingFactor});
                if (this.options.boardClick !== undefined && ( (this.json.options === undefined) || (! this.json.options.includes("no-piece-click")) )) {
                    use.click((e : Event) => {this.options.boardClick!(-1, -1, node.id); e.stopPropagation(); });
                }
            }
        }

        draw.viewbox(field.viewbox());

        // annotations
        if (this.options.showAnnotations) {
            this.annotateField(field, node2xy);
        }

        // // if there's a board backfill, it needs to be done before rotation
        // const backfilled = this.backFill(polys, true);

        // // if there are reserves areas, those also need to be placed before rotation
        // if (this.json.board.style.startsWith("dvgc")) {
        //     const allPoints = (polys!.flat().flat() as IPolyPolygon[]).map(p => p.points).flat();
        //     const xMin = Math.min(...allPoints.map(pt => pt.x));
        //     const xMax = Math.max(...allPoints.map(pt => pt.x));
        //     const yMin = Math.min(...allPoints.map(pt => pt.y));
        //     const yMax = Math.max(...allPoints.map(pt => pt.y));
        //     this.reservesArea({
        //         bottomN: yMin - (this.cellsize / 2),
        //         topS: yMax + (this.cellsize / 2),
        //         xLeft: xMin,
        //         xRight: xMax,
        //     });
        // }

        // const box = this.rotateBoard();

        // // `pieces` area, if present
        // this.piecesArea(box);

        // // button bar
        // this.placeButtonBar(box);

        // // key
        // this.placeKey(box);

        // // scrollBar
        // this.placeScroll(box);

        // // compassRose
        // this.placeCompass(box);

        // if (!backfilled) {
        //     this.backFill(polys);
        // }
    }

    protected annotateField(field: Svg, node2xy: Map<string, IPoint>) {
        if (this.json === undefined) {
            throw new Error("Object in an invalid state!");
        }
        type Shape = "square"|"circle"|"hexf"|"hexp";

        if ( ("annotations" in this.json) && (this.json.annotations !== undefined) ) {
            const notes = field.group().id("annotations");
            for (const note of this.json.annotations as AnnotationTree[]) {
                if ( (! ("type" in note)) || (note.type === undefined) ) {
                    throw new Error("Invalid annotation format found.");
                }                const cloned = {...note};
                if ("targets" in cloned) {
                    // @ts-expect-error (only used to generate UUID)
                    delete cloned.id;
                }
                if ( (note.type !== undefined) && (note.type === "enter" || note.type === "exit") ) {
                    let colour = this.options.colourContext.annotations;
                    if ( ("colour" in note) && (note.colour !== undefined) ) {
                        colour = this.resolveColour(note.colour) as string;
                    }
                    let strokeWeight = this.cellsize* 0.05;
                    if (this.json.board !== null && this.json.board !== undefined && "strokeWeight" in this.json.board && this.json.board.strokeWeight !== undefined) {
                        strokeWeight = this.json.board.strokeWeight;
                    }
                    let dasharray: string|undefined;
                    if (note.style !== "solid") {
                        dasharray = (4 * Math.ceil(strokeWeight / (this.cellsize * 0.05))).toString();
                    }
                    if (note.dashed !== undefined && note.dashed !== null) {
                        dasharray = (note.dashed ).join(" ");
                    }
                    let bgopacity = 1;
                    if ( ("occlude" in note) && note.occlude === false) {
                        bgopacity = 0;
                    }
                    let shape: Shape = "square";
                    if ( ("shape" in note) && (note.shape !== undefined) ) {
                        shape = note.shape as Shape;
                    }
                    for (const node of (note.nodes)) {
                        // draw the shape
                        const pt = node2xy.get(node);
                        if (pt === undefined) {
                            throw new Error(`Annotation - Enter: Could not find coordinates for the node ${node}.`);
                        }
                        if (shape === "square") {
                            notes.rect(this.cellsize, this.cellsize)
                                .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                .fill("none")
                                .stroke({color: this.options.colourContext.background, width: strokeWeight, linecap: "round", linejoin: "round", opacity: bgopacity})
                                .center(pt.x, pt.y)
                                .attr({ 'pointer-events': 'none' });
                            notes.rect(this.cellsize, this.cellsize)
                                .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                .fill("none")
                                .stroke({color: colour, width: strokeWeight, dasharray, linecap: "round", linejoin: "round"})
                                .center(pt.x, pt.y)
                                .attr({ 'pointer-events': 'none' });
                        } else if (shape === "circle") {
                            notes.circle(this.cellsize * 1.1, this.cellsize * 1.1)
                                .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                .fill("none")
                                .stroke({color: this.options.colourContext.background, width: strokeWeight, linecap: "round", linejoin: "round", opacity: bgopacity})
                                .center(pt.x, pt.y)
                                .attr({ 'pointer-events': 'none' });
                            notes.circle(this.cellsize * 1.1, this.cellsize * 1.1)
                                .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                .fill("none")
                                .stroke({color: colour, width: strokeWeight, dasharray, linecap: "round", linejoin: "round"})
                                .center(pt.x, pt.y)
                                .attr({ 'pointer-events': 'none' });
                        } else if (shape.startsWith("hex")) {
                            let start = 0;
                            if (shape === "hexf") {
                                start = -30;
                            }
                            const periph: [number,number][] = [];
                            for (let i = 0; i < 6; i++) {
                                periph.push(projectPoint(pt.x, pt.y, this.cellsize * 1.25 * 0.5, start + (i*60)));
                            }
                            notes.polygon(periph)
                                .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                .fill("none")
                                .stroke({color: this.options.colourContext.background, width: strokeWeight, linecap: "round", linejoin: "round", opacity: bgopacity})
                                .center(pt.x, pt.y)
                                .attr({ 'pointer-events': 'none' });
                            notes.polygon(periph)
                                .addClass(`aprender-annotation-${x2uid(cloned)}`)
                                .fill("none")
                                .stroke({color: colour, width: strokeWeight, dasharray, linecap: "round", linejoin: "round"})
                                .center(pt.x, pt.y)
                                .attr({ 'pointer-events': 'none' });
                        }
                    }
                }
            }
        }
    }
}

