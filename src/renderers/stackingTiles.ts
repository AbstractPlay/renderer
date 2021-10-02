import { Svg } from "@svgdotjs/svg.js";
import { GridPoints } from "../GridGenerator";
import { IRendererOptionsIn, RendererBase } from "../RendererBase";
import { APRenderRep } from "../schema";

export class StackingTilesRenderer extends RendererBase {

    constructor() {
        super("stacking-tiles");
    }

    public render(json: APRenderRep, draw: Svg, options: IRendererOptionsIn): void {
        json = this.jsonPrechecks(json);
        const opts = this.optionsPrecheck(options);

        // BOARD
        // Delegate to style-specific renderer
        let gridPoints: GridPoints;
        if (! ("style" in json.board)) {
            throw new Error(`This 'board' schema cannot be handled by the '${ this.name }' renderer.`);
        }
        /*
            This renderer needs a little more information than just the grid points themselves.

            `offsetY` determines the base of the first piece in the stack.
            `tileWidth` is the width of the stacking tiles.
            `tileHeight` is the height of the stacking tiles.
        */
        const effWidth: number = this.cellsize * 0.9;
        const offsetX: number = effWidth / 2;
        const offsetY: number = effWidth / 2;
        const tileWidth: number = effWidth;
        const tileHeight: number = Math.floor(effWidth / 8);
        switch (json.board.style) {
            case "squares-checkered":
            case "squares":
                gridPoints = this.squares(json, draw, opts);
                break;
            // case "hex_of_hex":
            //     gridPoints = this.hexOfHex(json, draw, opts);
            //     offsetX = this.cellsize / 4;
            //     offsetY = (this.cellsize * Math.sqrt(3)) / 2;
            //     tileWidth = this.cellsize / 2;
            //     tileHeight = Math.floor((this.cellsize * Math.sqrt(3)) / 8);
            //     break;
            default:
                throw new Error(`The requested board style (${ json.board.style }) is not supported by the '${ this.name }' renderer.`);
        }

        // Now place the pieces
        const group = draw.group().id("pieces");
        if (json.pieces !== null) {
            // Generate pieces array
            let pieces: string[][][] = new Array();

            if (typeof json.pieces === "string") {
                // Does it contain commas
                if (json.pieces.indexOf(",") >= 0) {
                    for (const row of json.pieces.split("\n")) {
                        let node: string[][];
                        if (row === "_") {
                            node = new Array(json.board.width).fill([]);
                        } else {
                            let cells = row.split(",");
                            cells = cells.map((x) => { if (x === "") {return "-"; } else {return x; } });
                            node = cells.map((x) => [x]);
                        }
                        pieces.push(node);
                    }
                } else {
                    throw new Error("This renderer requires that you use the comma-delimited or array format of the `pieces` property.");
                }
            } else if ( (json.pieces instanceof Array) && (json.pieces[0] instanceof Array) && (json.pieces[0][0] instanceof Array) ) {
                pieces = json.pieces as string[][][];
            } else {
                throw new Error("Unrecognized `pieces` property.");
            }

            // Place the pieces according to the grid
            for (let row = 0; row < pieces.length; row++) {
                for (let col = 0; col < pieces[row].length; col++) {
                    for (const key of pieces[row][col]) {
                        if ( (key !== null) && (key !== "-") ) {
                            let parts = key.split("");
                            if (parts.length > 7) {
                                parts = parts.slice(parts.length - 8);
                                parts[0] = "0";
                            }
                            const point = gridPoints[row][col];
                            for (let i = 0; i < parts.length; i++) {
                                const idx = parseInt(parts[i], 10);
                                if ( (idx === undefined) && (isNaN(idx)) ) {
                                    throw new Error(`The '${this.name}' renderer expects that each piece in the stack be a single digit between 1 and 9.`);
                                }
                                const x = point.x - offsetX;
                                const y = point.y + offsetY - (tileHeight * (i + 1));
                                // regular piece
                                if (idx > 0) {
                                    const color = opts.colours[idx];
                                    group.rect(tileWidth, tileHeight)
                                        .move(x, y)
                                        .fill(color)
                                        .stroke({width: tileHeight * 0.2, color: "#fff"});
                                // overflow piece (there should only be one)
                                } else {
                                    group.line(x, y + (tileHeight / 2), x + tileWidth, y + (tileHeight / 2))
                                        .fill("#000")
                                        .stroke({width: tileHeight, color: "#000", dasharray: "4"});
                                }
                            }
                        }
                    }
                }
            }
        }

        // Finally, annotations
        if ( ("annotations" in json) && (json.annotations !== undefined) ) {
            const notes = draw.group().id("annotations");
            // const markerArrow = notes.marker(5, 5, (add) => add.path("M 0 0 L 10 5 L 0 10 z"));
            const markerArrow = notes.marker(4, 4, (add) => add.path("M0,0 L4,2 0,4"));
            const markerCircle = notes.marker(2, 2, (add) => add.circle(2).fill("black"));
            for (const note of json.annotations) {
                if (note.type === "mvmtMain") {
                    if ( (! ("points" in note)) || (note.points === undefined) || (! (note.points instanceof Array)) || (note.points.length < 2) ) {
                        throw new Error("The annotation `mvmtMain` requries that at least two points be defined.");
                    }
                    const points: string[] = [];
                    for (const point of note.points) {
                        const [x, y] = point.split(",");
                        points.push(`${gridPoints[+y][+x].x},${gridPoints[+y][+x].y}`);
                    }
                    const line = notes.polyline(points.join(" ")).stroke({width: 1.5, color: "black"});
                    line.marker("end", markerArrow);
                    line.marker("start", markerCircle);
                } else {
                    throw new Error(`The requested annotation type (${note.type}) is not implemented.`);
                }
            }
        }

        // Rotate the board if requested
        if (opts.rotate > 0) {
            this.rotateBoard(draw);
        }
    }
}
