import { Svg, StrokeData } from "@svgdotjs/svg.js";
import { APRenderRep, AnnotationFreespace, AreaKey, Freepiece as IPiece } from "../schemas/schema";
import { IRendererOptionsIn, RendererBase } from "./_base";
import { IPoint } from "../grids/_base";
import { rotate, usePieceAt } from "../common/plotting";
import { x2uid} from "../common/glyph2uid";

type BackFill = {
    type?: "full"|"board";
    colour: string;
    opacity?: number;
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
        const width = this.json.board.width;
        const height = this.json.board.height;
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
        let backFillObj: BackFill|undefined;
        if ( ("backFill" in this.json.board) && (this.json.board.backFill !== undefined) && (this.json.board.backFill !== null) ) {
            backFillObj = this.json.board.backFill as BackFill;
        }
        let bgcolour = this.options.colourContext.background;
        if ( backFillObj !== undefined ) {
            bgcolour = backFillObj.colour;
        }
        let bgopacity = 1;
        if ( backFillObj !== undefined && backFillObj.opacity !== undefined ) {
            bgopacity = backFillObj.opacity;
        }

        const borderBuffer = 5;

        // Load all the pieces in the legend (have to do this first so the glyphs are available for marking the board)
        this.loadLegend();

        // clickable background field
        const field = this.rootSvg.nested().id("pieces").viewbox(ox - borderBuffer, oy - borderBuffer, width + (borderBuffer*2), height + (borderBuffer*2)).move(ox, oy);
        field.rect(width, height).id("aprender-backfill").move(ox, oy).fill({color: bgcolour, opacity: bgopacity}).back();
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
                const use = usePieceAt({svg: field, piece, cellsize: this.cellsize, x: pc.x, y: pc.y});
                rotate(use, pc.orientation || 0, pc.x, pc.y);
                if (this.options.boardClick !== undefined && ( (this.json.options === undefined) || (! this.json.options.includes("no-piece-click")) )) {
                    use.click((e : Event) => {this.options.boardClick!(pc.y, pc.x, pcid || pc.glyph); e.stopPropagation(); });
                }
            }
        }

        // annotations
        if (this.options.showAnnotations) {
            this.annotateField(field);
        }

        // const box = this.rotateBoard();
        const box = field.viewbox();

        // `pieces` area, if present
        const {newY, width: areaWidth} = this.piecesArea(box, {canvas: field})!;

        // // button bar
        // this.placeButtonBar(gridPoints);

        // key
        const xadjust = this.placeFixedKey(width);

        // this.backFill();

        // set the root viewbox
        // const box = this.rootSvg.bbox();
        // console.log(box);
        // const buffer = 5;
        // draw.viewbox(box.x - buffer, box.y - buffer, box.width + (buffer*2), box.height + (buffer*2));
        // eslint-disable-next-line prefer-const
        let {x, y, w, h} = field.viewbox();
        if (xadjust < 0) {
            x += xadjust;
            w += Math.abs(xadjust);
        } else {
            w += xadjust;
        }
        if (newY !== undefined) {
            const dy = Math.abs((y + h) - newY);
            h += dy;
            // field.viewbox(x, y, w, h);
        }
        if (areaWidth !== undefined) {
            if (w < areaWidth) {
                w = areaWidth;
            }
        }
        field.viewbox(x, y, w, h);
        draw.viewbox(x, y, w, h);
    }

    protected annotateField(field: Svg) {
        if (this.json === undefined) {
            throw new Error("Object in an invalid state!");
        }

        if ( ("annotations" in this.json) && (this.json.annotations !== undefined) ) {
            const notes = field.group().id("annotations");
            for (const note of this.json.annotations as AnnotationFreespace[]) {
                if ( (! ("type" in note)) || (note.type === undefined) ) {
                    throw new Error("Invalid annotation format found.");
                }
                if (note.type === "path") {
                    let stroke = this.options.colourContext.strokes;
                    if ( ("stroke" in note) && (note.stroke !== undefined) ) {
                        if (typeof note.stroke === "number") {
                            stroke = this.options.colours[note.stroke - 1];
                        } else {
                            stroke = this.resolveColour(note.stroke) as string;
                        }
                    }
                    let strokeWidth = 1;
                    if ( ("strokeWidth" in note) && (note.strokeWidth !== undefined) ) {
                        strokeWidth = note.strokeWidth;
                    }
                    let strokeOpacity = 1;
                    if ( ("strokeOpacity" in note) && (note.strokeOpacity !== undefined) ) {
                        strokeOpacity = note.strokeOpacity;
                    }
                    let fill = "#fff";
                    if ( ("fill" in note) && (note.fill !== undefined) ) {
                        fill = this.resolveColour(note.fill) as string;
                    }
                    let fillOpacity = 1;
                    if ( ("fillOpacity" in note) && (note.fillOpacity !== undefined) ) {
                        fillOpacity = note.fillOpacity;
                    }
                    const strokeData: StrokeData = {
                        color: stroke,
                        width: strokeWidth,
                        opacity: strokeOpacity,
                    };
                    if ( ("dashed" in note) && (note.dashed !== undefined) && (Array.isArray(note.dashed)) && (note.dashed.length > 0) ) {
                        strokeData.dasharray = (note.dashed).join(" ");
                    }
                    notes.path(note.path ).addClass(`aprender-annotation-${x2uid(note)}`).stroke(strokeData).fill({color: fill, opacity: fillOpacity});
                } else if (note.type === "glyph") {
                    const key = note.glyph;
                    const piece = field.root().findOne("#" + key) as Svg;
                    if ( (piece === null) || (piece === undefined) ) {
                        throw new Error(`Could not find the requested piece (${key}). Each piece in the \`pieces\` property *must* exist in the \`legend\`.`);
                    }
                    for (const pt of note.points as IPoint[]) {
                        usePieceAt({svg: field, piece, cellsize: this.cellsize, x: pt.x, y: pt.y});
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
                    let colour = this.options.colourContext.strokes;
                    if ( ("colour" in marker) && (marker.colour !== undefined) ) {
                        colour = this.resolveColour(marker.colour) as string;
                    }
                    let fontsize = 17;
                    if ( ("size" in marker) && (marker.size !== undefined) ) {
                        fontsize = marker.size;
                    }

                    const [{x: x1, y: y1}, {x: x2, y: y2}] = marker.points

                    const text = field.text(marker.label)
                        .attr("dy", "0.55em")
                        .addClass(`aprender-marker-${x2uid(marker)}`)
                        .font({size: fontsize, fill: colour, anchor: "middle"})
                        .attr("dominant-baseline", "middle")
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
                        const use = usePieceAt({svg: field, piece, cellsize: this.cellsize, x: pt.x, y: pt.y});
                        if ( ("orientation" in marker) && (marker.orientation !== undefined) ) {
                            rotate(use, marker.orientation, pt.x, pt.y);
                        }
                    }
                } else if (marker.type === "path") {
                    let stroke = this.options.colourContext.strokes;
                    if ( ("stroke" in marker) && (marker.stroke !== undefined) ) {
                        stroke = this.resolveColour(marker.stroke) as string;
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
                        fill = this.resolveColour(marker.fill) as string;
                    }
                    let fillOpacity = 1;
                    if ( ("fillOpacity" in marker) && (marker.fillOpacity !== undefined) ) {
                        fillOpacity = marker.fillOpacity;
                    }
                    const strokeData: StrokeData = {
                        color: stroke,
                        width: strokeWidth,
                        opacity: strokeOpacity,
                    };
                    if ( ("dashed" in marker) && (marker.dashed !== undefined) && (Array.isArray(marker.dashed)) && (marker.dashed.length > 0) ) {
                        strokeData.dasharray = (marker.dashed).join(" ");
                    }
                    field.path(marker.path).addClass(`aprender-marker-${x2uid(marker)}`).stroke(strokeData).fill({color: fill, opacity: fillOpacity});
                }
            }
        }
    }

    /**
     * Generates the key and then places it appropriately.
     *
     * @param grid - The grid of points; used for positioning.
     * @param position - If given, overrides the JSON setting.
     */
    protected placeFixedKey(width: number, position?: "left"|"right"): number {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Invalid object state.");
        }
        if ( ("areas" in this.json) && (this.json.areas !== undefined) && (Array.isArray(this.json.areas)) && (this.json.areas.length > 0) ) {
            const keys = this.json.areas.filter((b) => b.type === "key") as AreaKey[];
            if (keys.length > 1) {
                throw new Error("Only one key may be defined.");
            }
            if (keys.length === 1) {
                const key = keys[0];
                const keyimg = this.buildKey(key);
                const y = 0
                // Position defaults to "right"
                // If a position is passed by the renderer, it overrides everything
                // Otherwise, the JSON prevails
                let pos = "right";
                if (position !== undefined) {
                    pos = position;
                } else if (key.position !== undefined) {
                    pos = key.position;
                }
                let x = 0;
                let xadjust = 0;
                if (pos === "left") {
                    x = (keyimg.viewbox().w * 1.5) * -1;
                    xadjust = x;
                } else {
                    x = width + (keyimg.viewbox().w * 0.5);
                    xadjust = x + keyimg.viewbox().w;
                }
                const used = this.rootSvg.use(keyimg).size(keyimg.viewbox().w, keyimg.viewbox().h).dmove(x, y);
                let clickable = true;
                if (key.clickable !== undefined) {
                    clickable = key.clickable
                }
                if ( (this.options.boardClick !== undefined) && (clickable) ) {
                    const top = used.y() as number;
                    const height = used.height() as number;
                    const numEntries = key.list.length;
                    const btnHeight = height / numEntries;
                    used.click((e: { clientX: number; clientY: number; }) => {
                        const point = used.point(e.clientX, e.clientY);
                        const yRelative = point.y - top;
                        const row = Math.floor(yRelative / btnHeight);
                        if ( (row >= 0) && (row < numEntries) ) {
                            let value = key.list[row].name;
                            if (key.list[row].value !== undefined) {
                                value = key.list[row].value!;
                            }
                            this.options.boardClick!(-1, -1, value);
                        }
                    });
                }
                return xadjust;
            }
        }
        return 0;
    }
}

