import { Svg, G as SVGG, Box as SVGBox } from "@svgdotjs/svg.js";
import { GridPoints, rectOfRects, IPoint, Poly } from "../grids";
import { APRenderRep, type Polypiece, type AreaPieces as IPiecesArea, type AreaPolyomino as IPolyArea } from "../schemas/schema";
import { IRendererOptionsIn, RendererBase } from "./_base";
import { usePieceAt } from "../common/plotting";
import { x2uid } from "../common/glyph2uid";

const icons = new Map<string, string>([
    ["flipy", `<symbol id="_icon-flipy" viewBox="0 0 24 24" fill="none"><path d="M2 18.1136V5.88641C2 4.18426 2 3.33319 2.54242 3.05405C3.08484 2.77491 3.77738 3.26959 5.16247 4.25894L6.74371 5.3884C7.35957 5.8283 7.6675 6.04825 7.83375 6.3713C8 6.69435 8 7.07277 8 7.8296V16.1705C8 16.9273 8 17.3057 7.83375 17.6288C7.6675 17.9518 7.35957 18.1718 6.74372 18.6117L5.16248 19.7411C3.77738 20.7305 3.08484 21.2251 2.54242 20.946C2 20.6669 2 19.8158 2 18.1136Z" stroke="#1C274C" stroke-width="1.5"/><path d="M22 18.1136V5.88641C22 4.18426 22 3.33319 21.4576 3.05405C20.9152 2.77491 20.2226 3.26959 18.8375 4.25894L17.2563 5.3884C16.6404 5.8283 16.3325 6.04825 16.1662 6.3713C16 6.69435 16 7.07277 16 7.8296V16.1705C16 16.9273 16 17.3057 16.1662 17.6288C16.3325 17.9518 16.6404 18.1718 17.2563 18.6117L18.8375 19.7411C20.2226 20.7305 20.9152 21.2251 21.4576 20.946C22 20.6669 22 19.8158 22 18.1136Z" stroke="#1C274C" stroke-width="1.5"/><path opacity="0.5" d="M12 14V10" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/><path opacity="0.5" d="M12 6V2" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/><path opacity="0.5" d="M12 22V18" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/></symbol>`],
    ["flipx", `<symbol id="_icon-flipx" viewBox="0 0 24 24" fill="none"><path d="M5.88641 2L18.1137 2C19.8158 2 20.6669 2 20.946 2.54242C21.2251 3.08484 20.7305 3.77738 19.7411 5.16247L18.6117 6.74372C18.1718 7.35957 17.9518 7.6675 17.6288 7.83375C17.3057 8 16.9273 8 16.1705 8L7.8296 8C7.07276 8 6.69435 8 6.3713 7.83375C6.04824 7.6675 5.82829 7.35957 5.3884 6.74372L4.25894 5.16248C3.26959 3.77738 2.77491 3.08484 3.05405 2.54242C3.33319 2 4.18426 2 5.88641 2Z" stroke="#1C274C" stroke-width="1.5"/><path d="M5.88641 22L18.1136 22C19.8158 22 20.6669 22 20.946 21.4576C21.2251 20.9152 20.7305 20.2226 19.7411 18.8375L18.6117 17.2563C18.1718 16.6404 17.9518 16.3325 17.6288 16.1662C17.3057 16 16.9273 16 16.1705 16L7.8296 16C7.07276 16 6.69435 16 6.3713 16.1662C6.04824 16.3325 5.8283 16.6404 5.3884 17.2563L4.25894 18.8375C3.26959 20.2226 2.77491 20.9152 3.05405 21.4576C3.33319 22 4.18426 22 5.88641 22Z" stroke="#1C274C" stroke-width="1.5"/><path opacity="0.5" d="M10 12L14 12" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/><path opacity="0.5" d="M18 12L22 12" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/><path opacity="0.5" d="M2 12L6 12" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/></symbol>`],
    ["cw", `<symbol id="_icon-cw" viewBox="0 0 24 24" fill="none"><path d="M11.5 20.5C6.80558 20.5 3 16.6944 3 12C3 7.30558 6.80558 3.5 11.5 3.5C16.1944 3.5 20 7.30558 20 12C20 13.5433 19.5887 14.9905 18.8698 16.238M22.5 15L18.8698 16.238M17.1747 12.3832L18.5289 16.3542L18.8698 16.238" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></symbol>`],
    ["ccw", `<symbol id="_icon-ccw" viewBox="0 0 24 24" fill="none"><path d="M12.5 20.5C17.1944 20.5 21 16.6944 21 12C21 7.30558 17.1944 3.5 12.5 3.5C7.80558 3.5 4 7.30558 4 12C4 13.5433 4.41128 14.9905 5.13022 16.238M1.5 15L5.13022 16.238M6.82531 12.3832L5.47107 16.3542L5.13022 16.238" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></symbol>`],
    ["cancel", `<symbol id="_icon-cancel" fill="#000000" viewBox="0 0 32 32"><path d="M16 29c-7.18 0-13-5.82-13-13s5.82-13 13-13 13 5.82 13 13-5.82 13-13 13zM16 6c-5.522 0-10 4.478-10 10s4.478 10 10 10c5.523 0 10-4.478 10-10s-4.477-10-10-10zM20.537 19.535l-1.014 1.014c-0.186 0.186-0.488 0.186-0.675 0l-2.87-2.87-2.87 2.87c-0.187 0.186-0.488 0.186-0.675 0l-1.014-1.014c-0.186-0.186-0.186-0.488 0-0.675l2.871-2.869-2.871-2.87c-0.186-0.187-0.186-0.489 0-0.676l1.014-1.013c0.187-0.187 0.488-0.187 0.675 0l2.87 2.87 2.87-2.87c0.187-0.187 0.489-0.187 0.675 0l1.014 1.013c0.186 0.187 0.186 0.489 0 0.676l-2.871 2.87 2.871 2.869c0.186 0.187 0.186 0.49 0 0.675z"></path></symbol>`],
]);

/**
 * This renderer places polyomino pieces on a square grid.
 * Pieces can overlap each other and be composed of multiple colours.
 *
 */
export class PolyominoRenderer extends RendererBase {

    public static readonly rendererName: string = "polyomino";

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
            return this.renderGlyph();
        }

        // Load all the pieces in the legend (have to do this early so the glyphs are available for marking the board)
        // Polymatrices are built into the base class
        // The legend is only used for `pieces` areas
        this.loadLegend();

        let gridPoints: GridPoints;
        // let origPoints: GridPoints;
        let polys: Poly[][]|undefined;
        if (! ("style" in this.json.board)) {
            throw new Error(`This 'board' schema cannot be handled by the '${ PolyominoRenderer.rendererName }' renderer.`);
        }
        switch (this.json.board.style) {
            case "squares-beveled":
            case "squares-checkered":
            case "squares":
                // origPoints = this.squares();
                [, polys] = this.squares();
                gridPoints = rectOfRects({gridHeight: (this.json.board.height as number) + 1, gridWidth: (this.json.board.width as number) + 1, cellSize: this.cellsize});
                gridPoints = gridPoints.map((row) => row.map((cell) => ({x: cell.x - (this.cellsize / 2), y: cell.y - (this.cellsize / 2)} as IPoint)));
                break;
            default:
                throw new Error(`The requested board style (${ this.json.board.style }) is not  supported by the multicell-square renderer.`);
        }

        // let baseStroke = 1;
        // if ( ("strokeWeight" in this.json.board) && (this.json.board.strokeWeight !== undefined) ) {
        //     baseStroke = this.json.board.strokeWeight;
        // }
        const cellsize = this.cellsize;

        // PIECES
        const board = this.rootSvg.findOne("#board") as SVGG;
        const group = board.group().id("pieces");
        if ( (this.json.pieces !== null) && (Array.isArray(this.json.pieces)) && (! Array.isArray(this.json.pieces[0])) ) {
            const pieces = this.json.pieces as Polypiece[];
            pieces.forEach(p => {
                if (p.z === undefined) {
                    p.z = 0;
                }
            });
            pieces.sort((a, b) => a.z! - b.z!);

            for (const piece of pieces) {
                const uid = x2uid(piece);
                // eslint-disable-next-line prefer-const
                let {row, col, matrix} = piece;
                const height = matrix.length;
                let width = 0;
                if (height > 0) {
                    width = matrix[0].length;
                }
                const {x: tlx, y: tly} = gridPoints[row][col];
                const realwidth = (width * cellsize);
                const realheight = (height * cellsize);

                // create nested SVG of the piece, with border
                const nested = this.rootSvg.defs().nested().id(`aprender-polyomino-${uid}`).viewbox(0, 0, realwidth, realheight);
                this.buildPoly(nested, matrix);

                // place it on the overall board
                const use = group.use(nested).width(realwidth).height(realheight).move(tlx, tly);
                if ( (piece.id !== undefined) && (this.options.boardClick !== undefined) ) {
                    use.click((e : Event) => {this.options.boardClick!(row, col, piece.id!); e.stopPropagation(); });
                }
            }
        }

        // annotations
        if (this.options.showAnnotations) {
            // for now, assuming this renderer will only need the 'outline' annotation
            // this.annotateBoard(origPoints);
            this.annotateBoard(gridPoints);
        }

        // if there's a board backfill, it needs to be done before rotation
        const backfilled = this.backFill(polys, true);

        const box = this.rotateBoard({ignore: true});

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

    protected piecesArea(box: SVGBox) {
        if (this.rootSvg === undefined) {
            throw new Error("Can't place a `pieces` area until the root SVG is initialized!");
        }
        if ( (this.json !== undefined) && (this.json.areas !== undefined) && (Array.isArray(this.json.areas)) && (this.json.areas.length > 0) ) {
            const areas = this.json.areas.filter((x) => x.type === "pieces" || x.type === "polyomino");
            const boardBottom = box.y2 + this.cellsize;
            // Width in number of cells, taking the maximum board width
            const boardWidth = Math.floor(box.width / this.cellsize);
            let placeY = boardBottom + (this.cellsize * 0.33);
            for (let iArea = 0; iArea < areas.length; iArea++) {
                const area = areas[iArea] as IPiecesArea|IPolyArea;
                if (area.type === "pieces") {
                    let desiredWidth = boardWidth;
                    if (area.width !== undefined) {
                        desiredWidth = area.width;
                    }
                    const numPieces = area.pieces.length;
                    const numRows = Math.ceil(numPieces / desiredWidth);
                    const textHeight = this.cellsize / 3; // 10; // the allowance for the label
                    const cellsize = this.cellsize; //  * 0.75;
                    const areaWidth = cellsize * desiredWidth;
                    const areaHeight = (textHeight * 2) + (cellsize * numRows);
                    let markWidth = 0;
                    let markColour: string|undefined;
                    if ( ("ownerMark" in area) && (area.ownerMark !== undefined) ) {
                        markWidth = 15;
                        if (typeof area.ownerMark === "number") {
                            markColour = this.options.colours[area.ownerMark - 1];
                        } else {
                            markColour = area.ownerMark;
                        }
                    }
                    const nested = this.rootSvg.nested().id(`_pieces${iArea}`).size(areaWidth+2, areaHeight+2).viewbox(-1 - markWidth - 5, -1, areaWidth+2+markWidth+10, areaHeight+2);
                    if ("background" in area) {
                        nested.rect(areaWidth,areaHeight).fill(area.background as string);
                    }
                    for (let iPiece = 0; iPiece < area.pieces.length; iPiece++) {
                        const p = area.pieces[iPiece];
                        const row = Math.floor(iPiece / desiredWidth);
                        const col = iPiece % desiredWidth;
                        const piece = this.rootSvg.findOne("#" + p) as Svg;
                        if ( (piece === null) || (piece === undefined) ) {
                            throw new Error(`Could not find the requested piece (${p}). Each piece in the stack *must* exist in the \`legend\`.`);
                        }
                        const newx = col * cellsize;
                        const newy = (textHeight * 2) + (row * cellsize);
                        const use = nested.use(piece).size(cellsize, cellsize).move(newx, newy).scale(0.75, 0.75, newx + (cellsize / 2), newy + (cellsize / 2));
                        // const use = usePieceAt(nested, piece, cellsize, newx, newy, 1);
                        if (this.options.boardClick !== undefined) {
                            use.click((e: Event) => {this.options.boardClick!(-1, -1, p); e.stopPropagation();});
                        }
                    }

                    // add marker line if indicated
                    if ( (markWidth > 0) && (markColour !== undefined) ) {
                        nested.rect(markWidth, nested.bbox().height).fill(markColour).stroke({width: 1, color: "black"}).dmove((markWidth * -1) - 5, 0);
                        // nested.line(markWidth * -1, 0, markWidth * -1, nested.bbox().height).stroke({width: markWidth, color: markColour});
                    }

                    // Add area label
                    const tmptxt = this.rootSvg.text(area.label).font({size: textHeight, anchor: "start", fill: this.options.colourContext.strokes});
                    const txtWidth = tmptxt.bbox().w;
                    tmptxt.remove();
                    nested.width(Math.max(areaWidth, txtWidth));
                    const txt = nested.text(area.label).addClass(`aprender-area-label`);
                    txt.font({size: textHeight, anchor: "start", fill: this.options.colourContext.strokes})
                        .attr("alignment-baseline", "hanging")
                        .attr("dominant-baseline", "hanging")
                        .move(0, 0);

                    // Now place the whole group below the board
                    // const placed = this.rootSvg.use(nested);
                    nested.move(box.x, placeY);
                    placeY += nested.bbox().height + (this.cellsize * 0.5);
                } else {
                    const numRows = 5;
                    const desiredWidth = 5;
                    const textHeight = this.cellsize / 3; // 10; // the allowance for the label
                    const cellsize = this.cellsize;
                    const areaWidth = cellsize * desiredWidth;
                    const areaHeight = (textHeight * 2) + (cellsize * numRows);
                    const nested = this.rootSvg.nested().id(`_polyomino`).size(areaWidth+2, areaHeight+2).viewbox(-1 - 5, -1, areaWidth+2+10, areaHeight+2);
                    if ("background" in area && area.background !== undefined) {
                        if (area.background.startsWith("_")) {
                            const [,,prop] = area.background.split("_");
                            if (prop in this.options.colourContext) {
                                const colour = this.options.colourContext[prop as "background"|"strokes"|"labels"|"annotations"|"fill"];
                                nested.rect(areaWidth,areaHeight).fill(colour).opacity(0.25);
                            }
                        } else {
                            nested.rect(areaWidth,areaHeight).fill(area.background);
                        }
                    }

                    // load icons
                    for (const v of icons.values()) {
                        this.rootSvg.defs().svg(v);
                    }
                    // place icons along the top
                    const iconOrder = ["ccw", "cw", "flipx", "flipy", "cancel"];
                    for (let i = 0; i < iconOrder.length; i++) {
                        const piece = this.rootSvg.findOne(`#_icon-${iconOrder[i]}`) as Svg;
                        if (piece === null || piece === undefined) {
                            throw new Error(`Could not load the icon ${iconOrder[i]}`);
                        }
                        if (iconOrder[i] === "cancel") {
                            piece.fill(this.options.colourContext.fill);
                        }
                        piece.find("path").each(e => e.stroke(this.options.colourContext.strokes));
                        const newx = i * cellsize;
                        const newy = (textHeight * 2);
                        nested.use(piece).size(cellsize, cellsize).move(newx, newy).scale(0.75, 0.75, newx + (cellsize / 2), newy + (cellsize / 2));
                        // const use = usePieceAt(nested, piece, cellsize, newx, newy, 1);
                        const handler = nested.rect(cellsize, cellsize).move(newx, newy).stroke("none").fill({color: "#fff", opacity: 0});
                        if (this.options.boardClick !== undefined) {
                            handler.click((e: Event) => {this.options.boardClick!(-1, -1, `_btn_${iconOrder[i]}`); e.stopPropagation();});
                        }
                    }
                    // build the poly
                    const uid = x2uid(area.matrix);
                    const height = area.matrix.length;
                    let width = 0;
                    if (height > 0) {
                        width = area.matrix[0].length;
                    }
                    const realwidth = (width * this.cellsize);
                    const realheight = (height * this.cellsize);
                    const poly = this.rootSvg.defs().nested().id(`_polyomino-area-${uid}`).viewbox(0, 0, realwidth, realheight);
                    this.buildPoly(poly, area.matrix, {divided: true, tlmark: true});
                    // place it
                    nested.use(poly).size(areaWidth, cellsize * (numRows - 1)).move(0, (textHeight * 2) + cellsize);

                    // Add area label
                    const tmptxt = this.rootSvg.text(area.label).font({size: textHeight, anchor: "start", fill: this.options.colourContext.strokes});
                    const txtWidth = tmptxt.bbox().w;
                    tmptxt.remove();
                    nested.width(Math.max(areaWidth, txtWidth));
                    const txt = nested.text(area.label).addClass(`aprender-area-label`);
                    txt.font({size: textHeight, anchor: "start", fill: this.options.colourContext.strokes})
                        .attr("alignment-baseline", "hanging")
                        .attr("dominant-baseline", "hanging")
                        .move(0, 0);

                    // Now place the whole group below the board
                    // const placed = this.rootSvg.use(nested);
                    nested.move(box.x, placeY);
                    placeY += nested.bbox().height + (this.cellsize * 0.33);
                }
            }
        }
    }

    /**
     * Helper function for producing a single glyph when `board` is set to `null`.
     *
     */
    private renderGlyph(): void {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Object in invalid state!");
        }
        // Load all the pieces in the legend
        this.loadLegend();
        if (this.json.pieces === null) {
            throw new Error("There must be a piece given in the `pieces` property.");
        }
        const key = this.json.pieces as string;
        const piece = this.rootSvg.findOne("#" + key) as Svg;
        if ( (piece === null) || (piece === undefined) ) {
            throw new Error(`Could not find the requested piece (${key}). Each piece in the \`pieces\` property *must* exist in the \`legend\`.`);
        }
        this.rootSvg.viewbox(0, 0, this.cellsize, this.cellsize);
        usePieceAt(this.rootSvg, piece, this.cellsize, this.cellsize / 2, this.cellsize / 2, 0.9);
    }
}

