import { Svg } from "@svgdotjs/svg.js";
import { APRenderRep } from "../schemas/schema";
import { IRendererOptionsIn, RendererBase } from "./_base";
import { IPoint } from "../grids/_base";

export interface IPiecesArea {
    type: "pieces";
    pieces: [string, ...string[]];
    label: string;
}

// from .d.ts file
interface IPiece {
    /**
     * The name of the glyph. Must appear in the legend. Can be composed and transformed just as for any other renderer.
     */
    glyph: string;
    /**
     * A unique ID that should be passed to the click handler. If not provided, it will just return the glyph name.
     */
    id?: string;
    /**
     * Absolute x coordinate of the centre of the glyph. Glyphs placed outside of the visible playing area will not appear.
     */
    x: number;
    /**
     * Absolute y coordinate of the centre of the glyph. Glyphs placed outside of the visible playing area will not appear.
     */
    y: number;
    /**
     * Expressed in degrees, relative to 0&deg; being towards the top of the display and postive rotation moving in a clockwise direction. So the glyph is placed as composed in the legend and then rotated. 90&deg; would turn the glyph to the right. Negative degrees are fine.
     */
    orientation: number;
};

/**
 * The `freespace` renderer lets you just place defined glyphs wherever and however you want.
 *
 */
export class FreespaceRenderer extends RendererBase {

    public static readonly rendererName: string = "freespace";

    public render(json: APRenderRep, draw: Svg, options: IRendererOptionsIn): void {
        this.jsonPrechecks(json);
        if (this.json === undefined) {
            throw new Error("JSON prechecks fatally failed.");
        }
        this.optionsPrecheck(options);
        this.rootSvg = draw;

        // BOARD
        // Delegate to style-specific renderer
        if (this.json.board === null) {
            throw new Error("This renderer requires that `board` be defined");
        }
        if ( (! ("width" in this.json.board)) || (! ("height" in this.json.board)) || (this.json.board.width === undefined) || (this.json.board.height === undefined) ) {
            throw new Error("At the very least, the `board` property requires the `width` and `height` properties.");
        }
        const width = this.json.board.width as number;
        const height = this.json.board.height as number;
        let [ox, oy] = [0,0];
        if ( ("origin" in this.json.board) && (this.json.board !== undefined) ) {
            const origin = this.json.board.origin as {[k: string]: number};
            if ("x" in origin) {
                ox = origin.x;
            }
            if ("y" in origin) {
                oy = origin.y;
            }
        }
        let backFill = "#fff";
        if ( ("backFill" in this.json.board) && (this.json.board.backFill !== undefined) ) {
            backFill = this.json.board.backFill as string;
        }
        const borderBuffer = 5;

        // Load all the pieces in the legend (have to do this first so the glyphs are available for marking the board)
        this.loadLegend();

        // clickable background field
        const field = this.rootSvg.nested().id("pieces").viewbox(ox - borderBuffer, oy - borderBuffer, width + (borderBuffer*2), height + (borderBuffer*2)).move(ox, oy);
        field.rect(width, height).move(ox, oy).fill(backFill).back();
        if (this.options.boardClick !== undefined) {
            const originX = field.x() as number;
            const originY = field.y() as number;
            const genericCatcher = ((e: { clientX: number; clientY: number; }) => {
                const point = field.point(e.clientX, e.clientY);
                this.options.boardClick!(point.y - originY, point.x - originX, "_field");
            });
            field.click(genericCatcher);
        }

        // markers
        this.markField(field);

        // PIECES
        if (this.json.pieces !== null) {
            for (const pc of this.json.pieces as IPiece[]) {
                let pcid: string|undefined;
                if ( ("id" in pc) && (pc.id !== undefined) ) {
                    pcid = pc.id;
                }
                const piece = this.rootSvg.findOne("#" + pc.glyph) as Svg;
                if ( (piece === null) || (piece === undefined) ) {
                    throw new Error(`Could not find the requested piece (${pc.glyph}). Each piece in the \`pieces\` property *must* exist in the \`legend\`.`);
                }
                let sheetCellSize = piece.viewbox().h;
                if ( (sheetCellSize === null) || (sheetCellSize === undefined) ) {
                    sheetCellSize = piece.attr("data-cellsize") as number;
                    if ( (sheetCellSize === null) || (sheetCellSize === undefined) ) {
                        throw new Error(`The glyph you requested (${pc.glyph}) does not contain the necessary information for scaling. Please use a different sheet or contact the administrator.`);
                    }
                }
                const use = field.use(piece);
                if (pcid !== undefined) {
                    use.id(pcid);
                }
                const factor = (this.cellsize / sheetCellSize);
                const newsize = sheetCellSize * factor;
                const delta = this.cellsize - newsize;
                const newx = pc.x - (this.cellsize / 2) + (delta / 2);
                const newy = pc.y - (this.cellsize / 2) + (delta / 2);
                use.dmove(newx, newy);
                use.scale(factor, newx, newy);
                use.rotate(pc.orientation);
                if (this.options.boardClick !== undefined) {
                    use.click((e : Event) => {this.options.boardClick!(pc.x, pc.y, pcid || pc.glyph); e.stopPropagation(); });
                }
            }
        }

        // annotations
        if (this.options.showAnnotations) {
            this.annotateField(field);
        }

        // // `pieces` area, if present
        // this.piecesArea(gridPoints);

        // // button bar
        // this.placeButtonBar(gridPoints);

        // key
        this.placeKey([[{x: 175, y: 50} as IPoint, {x: 175 + width, y: 50} as IPoint]]);

        // this.backFill();
    }

    protected annotateField(field: Svg) {
        if (this.json === undefined) {
            throw new Error("Object in an invalid state!");
        }

        if ( ("annotations" in this.json) && (this.json.annotations !== undefined) ) {
            const notes = field.group().id("annotations");
            for (const note of this.json.annotations) {
                if ( (! ("type" in note)) || (note.type === undefined) ) {
                    throw new Error("Invalid annotation format found.");
                }
                if (note.type === "path") {
                    let stroke = "#000";
                    if ( ("stroke" in note) && (note.stroke !== undefined) ) {
                        if (typeof note.stroke === "number") {
                            stroke = this.options.colours[note.stroke - 1];
                        } else {
                            stroke = note.stroke as string;
                        }
                    }
                    let strokeWidth = 1;
                    if ( ("strokeWidth" in note) && (note.strokeWidth !== undefined) ) {
                        strokeWidth = note.strokeWidth as number;
                    }
                    let strokeOpacity = 1;
                    if ( ("strokeOpacity" in note) && (note.strokeOpacity !== undefined) ) {
                        strokeOpacity = note.strokeOpacity as number;
                    }
                    let fill = "#fff";
                    if ( ("fill" in note) && (note.fill !== undefined) ) {
                        if (typeof note.fill === "number") {
                            fill = this.options.colours[note.fill - 1];
                        } else {
                            fill = note.fill as string;
                        }
                    }
                    let fillOpacity = 1;
                    if ( ("fillOpacity" in note) && (note.fillOpacity !== undefined) ) {
                        fillOpacity = note.fillOpacity as number;
                    }
                    notes.path(note.path as string).stroke({color: stroke, width: strokeWidth, opacity: strokeOpacity}).fill({color: fill, opacity: fillOpacity});
                } else if (note.type === "glyph") {
                    const key = note.glyph as string;
                    const piece = field.root().findOne("#" + key) as Svg;
                    if ( (piece === null) || (piece === undefined) ) {
                        throw new Error(`Could not find the requested piece (${key}). Each piece in the \`pieces\` property *must* exist in the \`legend\`.`);
                    }
                    let sheetCellSize = piece.viewbox().h;
                    if ( (sheetCellSize === null) || (sheetCellSize === undefined) ) {
                        sheetCellSize = piece.attr("data-cellsize") as number;
                        if ( (sheetCellSize === null) || (sheetCellSize === undefined) ) {
                            throw new Error(`The glyph you requested (${key}) does not contain the necessary information for scaling. Please use a different sheet or contact the administrator.`);
                        }
                    }
                    for (const pt of note.points as IPoint[]) {
                        const use = field.use(piece);
                        const factor = (this.cellsize / sheetCellSize);
                        const newsize = sheetCellSize * factor;
                        const delta = this.cellsize - newsize;
                        const newx = pt.x - (this.cellsize / 2) + (delta / 2);
                        const newy = pt.y - (this.cellsize / 2) + (delta / 2);
                        use.dmove(newx, newy);
                        use.scale(factor, newx, newy);
                    }
                }
            }
        }
    }

    /**
     * Markers are placed right after the board itself is generated, and so are obscured by placed pieces.
     * This renderer only supports a subset of the defined markers, and interprets all row and col definitions as absolute x,y coordinates.
     *
     * @param field - The SVG `<group>` you want to add the markers too. This is just for the sake of organization.
     */
    protected markField(field: Svg): void {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Object in an invalid state!");
        }

        if ( ("board" in this.json) && (this.json.board !== undefined) && (this.json.board !== null) && ("markers" in this.json.board) && (this.json.board.markers !== undefined) && (Array.isArray(this.json.board.markers)) && (this.json.board.markers.length > 0) ) {
            if ("style" in this.json.board) {
                throw new Error("This `markField` function is only intended for use with the `freespace` renderer.");
            }

            for (const marker of this.json.board.markers) {
                if (marker.type === "label") {
                    let colour = "#000";
                    if ( ("colour" in marker) && (marker.colour !== undefined) ) {
                        if (typeof marker.colour === "number") {
                            colour = this.options.colours[marker.colour - 1];
                        } else {
                            colour = marker.colour;
                        }
                    }
                    let fontsize = 17;
                    if ( ("size" in marker) && (marker.size !== undefined) ) {
                        fontsize = marker.size;
                    }

                    const [{x: x1, y: y1}, {x: x2, y: y2}] = marker.points

                    const text = field.text(marker.label)
                        .font({size: fontsize, fill: colour, anchor: "middle"})
                        .attr("alignment-baseline", "hanging")
                        .attr("dominant-baseline", "hanging")
                    text.path(`M${x1},${y1} L${x2},${y2}`)
                        .attr("startOffset", "50%");
                } else if (marker.type === "glyph") {
                    const key = marker.glyph;
                    const piece = field.root().findOne("#" + key) as Svg;
                    if ( (piece === null) || (piece === undefined) ) {
                        throw new Error(`Could not find the requested piece (${key}). Each piece in the \`pieces\` property *must* exist in the \`legend\`.`);
                    }
                    let sheetCellSize = piece.viewbox().h;
                    if ( (sheetCellSize === null) || (sheetCellSize === undefined) ) {
                        sheetCellSize = piece.attr("data-cellsize") as number;
                        if ( (sheetCellSize === null) || (sheetCellSize === undefined) ) {
                            throw new Error(`The glyph you requested (${key}) does not contain the necessary information for scaling. Please use a different sheet or contact the administrator.`);
                        }
                    }
                    for (const pt of marker.points as IPoint[]) {
                        const use = field.use(piece);
                        const factor = (this.cellsize / sheetCellSize);
                        const newsize = sheetCellSize * factor;
                        const delta = this.cellsize - newsize;
                        const newx = pt.x - (this.cellsize / 2) + (delta / 2);
                        const newy = pt.y - (this.cellsize / 2) + (delta / 2);
                        use.dmove(newx, newy);
                        use.scale(factor, newx, newy);
                        if ( ("orientation" in marker) && (marker.orientation !== undefined) ) {
                            use.rotate(marker.orientation);
                        }
                    }
                } else if (marker.type === "path") {
                    let stroke = "#000";
                    if ( ("stroke" in marker) && (marker.stroke !== undefined) ) {
                        if (typeof marker.stroke === "number") {
                            stroke = this.options.colours[marker.stroke - 1];
                        } else {
                            stroke = marker.stroke;
                        }
                    }
                    let strokeWidth = 1;
                    if ( ("strokeWidth" in marker) && (marker.strokeWidth !== undefined) ) {
                        strokeWidth = marker.strokeWidth;
                    }
                    let strokeOpacity = 1;
                    if ( ("strokeOpacity" in marker) && (marker.strokeOpacity !== undefined) ) {
                        strokeOpacity = marker.strokeOpacity;
                    }
                    let fill = "#fff";
                    if ( ("fill" in marker) && (marker.fill !== undefined) ) {
                        if (typeof marker.fill === "number") {
                            fill = this.options.colours[marker.fill - 1];
                        } else {
                            fill = marker.fill;
                        }
                    }
                    let fillOpacity = 1;
                    if ( ("fillOpacity" in marker) && (marker.fillOpacity !== undefined) ) {
                        fillOpacity = marker.fillOpacity;
                    }
                    field.path(marker.path).stroke({color: stroke, width: strokeWidth, opacity: strokeOpacity}).fill({color: fill, opacity: fillOpacity});
                }
            }
        }
    }
}

