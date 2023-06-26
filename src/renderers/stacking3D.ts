import { GridPoints } from "../grids/_base";
import { APRenderRep } from "../schemas/schema";
import { IRendererOptionsIn, RendererBase } from "./_base";
import { rectOfRects } from "../grids";
import { Svg } from "@svgdotjs/svg.js";

/**
 * The `stacking-3D` renderer creates a square board seen in perspective. Stacks of pieces therefore does not (fully) obscure stacks behind them.
 *
 */
export class Stacking3DRenderer extends RendererBase {

    public static readonly rendererName: string = "stacking-3D";
    private f = -1;
    private a = 1;
    private t = Math.PI - 0.4 * Math.PI;
    private width = 0;
    private height = 0;

    constructor() {
        super();
    }

    private findaft(x1: number, x2: number, y:number): void {
      y = y + 1;
      const b = x2 - x1;
      if (b === 1)
        throw new Error("x2 cannot be x1 + 1");
      const a = x1 / (b - 1);
      if (y / b - 1 < -1)
        throw new Error("y / b - 1 < -1");
      if (y / b - 1 > 1)
        throw new Error("y / b - 1 > 1");
      const t = Math.asin(y / b - 1);
      const f = Math.cos(t) / (1 / b - 1);
      this.f = f;
      this.a = a;
      this.t = t;
      let p = this.projectUnscaled(0, 1);
      if (Math.abs(p[0] - x1) > 0.000001) {
        throw new Error("p[0] !== x1");
      }
      if (Math.abs(p[1] - y) > 0.000001) {
        throw new Error("p[1] !== y");
      }
      p = this.projectUnscaled(1, 1);
      if (Math.abs(p[0] - x2) > 0.000001) {
        throw new Error("p[0] !== x2");
      }
    }

    private project0(p: [number, number, number]): [number, number] {
        return [p[0] * this.f / p[2], p[1] * this.f / p[2]];
    }

    private projectUnscaled(x0: number, y0: number): [number, number] {
      const p1: [number, number, number] = [1, 1 / this.a, this.f / this.a];
      const p2: [number, number, number] = [1 + x0 / this.a, 1 / this.a, this.f / this.a];
      // const p3: [number, number, number] = [1, 1 / this.a * (1 + y0 * Math.sin(t)), this.f / this.a + y0 / this.a * Math.cos(t)];
      const p4: [number, number, number] = [1 + x0 / this.a, 1 / this.a * (1 + y0 * Math.sin(this.t)), this.f / this.a + y0 / this.a * Math.cos(this.t)];
      const p1p = this.project0(p1);
      const p2p = this.project0(p2);
      if (Math.abs(p1p[0] - this.a) > 0.000001) {
        throw new Error("p1p[0] !== a");
      }
      if (Math.abs(p1p[1] - 1) > 0.000001) {
        throw new Error("p1p[1] !== 1");
      }
      if (Math.abs(p2p[0] - (this.a + x0)) > 0.000001) {
        throw new Error("p2p[0] !== a + x0");
      }
      if (Math.abs(p2p[1] - 1) > 0.000001) {
        throw new Error("p2p[1] !== 1");
      }
      const p4p = this.project0(p4);
      return [p4p[0] - p1p[0], p4p[1]];
    }

    private project(x0: number, y0: number): [number, number] {
      const scaleX = this.cellsize * this.width;
      const scaleY = this.cellsize * this.height;
      const p = this.projectUnscaled(x0 / scaleX, 1 - y0 / scaleY);
      return [scaleX * p[0], scaleY * (1 - p[1])];
    }

    /*
    private transformAt0(x0: number, y0: number): {a: number, b: number, c: number, d: number, e: number, f: number} {
      const cellsize = this.cellsize;
      const [x, y] = this.project(x0, y0);
      const [xl] = this.project(x0 - cellsize / 10, y0);
      const [xd, yd] = this.project(x0, y0 + cellsize / 10);
      const a = (xl - x) / (cellsize / 10);
      const c = (xd - x) / (cellsize / 10);
      const d = (yd - y) / (cellsize / 10);
      return {a, b: 0, c, d, e: 0, f: 0};
    }
    */

    private transformAt(x0: number, y0: number): {a: number, b: number, c: number, d: number, e: number, f: number} {
      const cellsize = this.cellsize;
      const [x, y] = this.project(x0, y0);
      const t = cellsize / 10;
      const [x2] = this.project(x0 - t, y0);
      const [x3, y3] = this.project(x0, y0 + t);
      const a = (x - x2) / t;
      const b = 0;
      const c = -(x - x3) / t;
      const d = -(y - y3) / t;
      const e = -(-t*x + x*x - x*x2 - x*y + x3*y) / t;
      const f = -(-t*y - y*y + y*y3) / t;
      return { a, b, c, d, e, f };
    }

    private scaleAt(x0: number, y0: number): number {
      const cellsize = this.cellsize;
      const [x] = this.project(x0, y0);
      const t = cellsize / 10;
      const [x2] = this.project(x0 - t, y0);
      return (x - x2) / t;
    }

    private svgt(x0: number, y0: number, t: {a: number, b: number, c: number, d: number, e: number, f: number}): [number, number] {
      const x = t.a * x0 + t.c * y0 + t.e;
      const y = t.b * x0 + t.d * y0 + t.f;
      return [x, y];
    }

    private test(x0: number, y0: number): boolean {
      const cellsize = this.cellsize;
      const [x, y] = this.project(x0, y0);
      const t = cellsize / 10;
      const [x2] = this.project(x0 - t, y0);
      const [x3, y3] = this.project(x0, y0 + t);
      const st = this.transformAt(x0, y0);
      if (Math.abs(x - this.svgt(x, y, st)[0]) > 0.000001) {
        throw new Error("x0 !== svgt(x0)");
      }
      if (Math.abs(y - this.svgt(x, y, st)[1]) > 0.000001) {
        throw new Error("y0 !== svgt(y0)");
      }
      if (Math.abs(x2 - this.svgt(x - t, y, st)[0]) > 0.000001) {
        throw new Error("x2 !== svgt(x0 - cellsize / 10)");
      }
      if (Math.abs(y - this.svgt(x - t, y, st)[1]) > 0.000001) {
        throw new Error("y2 !== svgt(y2)");
      }
      if (Math.abs(x3 - this.svgt(x, y + t, st)[0]) > 0.000001) {
        throw new Error("x3 !== svgt(x3)");
      }
      if (Math.abs(y3 - this.svgt(x, y + t, st)[1]) > 0.000001) {
        throw new Error("y3 !== svgt(y3)");
      }
      return true;
    }

    /**
     * This draws the board and then returns a map of row/column coordinates to x/y coordinates.
     * This generator creates square boards of square cells. Points are the centre of each square.
     * The board is "drawn" in 3D and then projected onto the x-y plane, under the assumption that the viewer's eye is at (0,0,-f).
     * The 3D board has corners at TODO
     * @returns A map of row/column locations to x,y coordinates
     */
      protected squaresInPerspective(): GridPoints {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
          throw new Error("Object in an invalid state!");
        }

        // Check required properties
        if ( (this.json.board === null) || (! ("width" in this.json.board)) || (! ("height" in this.json.board)) || (this.json.board.width === undefined) || (this.json.board.height === undefined) ) {
          throw new Error("Both the `width` and `height` properties are required for this board type.");
        }

        this.findaft(-0.2, 1.1, 1.2);

        this.width = this.json.board.width as number;
        const width = this.width;
        this.height = this.json.board.height as number;
        const height: number = this.height;
        const cellsize = this.cellsize;

        let baseStroke = 1;
        let baseColour = "#000";
        let baseOpacity = 1;
        if ( ("strokeWeight" in this.json.board) && (this.json.board.strokeWeight !== undefined) ) {
            baseStroke = this.json.board.strokeWeight;
        }
        if ( ("strokeColour" in this.json.board) && (this.json.board.strokeColour !== undefined) ) {
            baseColour = this.json.board.strokeColour;
        }
        if ( ("strokeOpacity" in this.json.board) && (this.json.board.strokeOpacity !== undefined) ) {
            baseOpacity = this.json.board.strokeOpacity;
        }

        // Check for tiling
        const tilex = 0;
        const tiley = 0;
        const tileSpace = 0;

        // Get a grid of points
        const grid = rectOfRects({gridHeight: height, gridWidth: width, cellSize: cellsize, tileHeight: tiley, tileWidth: tilex, tileSpacing: tileSpace});
        const board = this.rootSvg.group().id("board");

        // Add board labels
        if ( (! this.json.options) || (! this.json.options.includes("hide-labels") ) ) {
            const labels = board.group().id("labels");
            let columnLabels = this.getLabels(width);
            if (this.options.rotate === 180) {
                columnLabels = columnLabels.reverse();
            }
            // Columns (letters)
            for (let col = 0; col < width; col++) {
                const pointTop = {x: grid[0][col].x, y: grid[0][col].y - cellsize};
                const pointBottom = {x: grid[height - 1][col].x, y: grid[height - 1][col].y + cellsize};
                const [topX, topY] = this.project(pointTop.x, pointTop.y);
                this.test(pointTop.x, pointTop.y);
                labels.text(columnLabels[col]).fill(baseColour).opacity(baseOpacity).center(topX, topY).transform(this.transformAt(pointTop.x, pointTop.y));
                const [bottomX, bottomY] = this.project(pointBottom.x, pointBottom.y);
                labels.text(columnLabels[col]).fill(baseColour).opacity(baseOpacity).center(bottomX, bottomY).transform(this.transformAt(pointBottom.x, pointBottom.y));
            }

            // Rows (numbers)
            const rowLabels: string[] = [];
            if (this.options.rotate === 180) {
                for (let row = 0; row < height; row++) {
                    rowLabels.push((row + 1).toString());
                }
            } else {
                for (let row = 0; row < height; row++) {
                    rowLabels.push((height - row).toString());
                }
            }
            for (let row = 0; row < height; row++) {
                const pointL = {x: grid[row][0].x - cellsize, y: grid[row][0].y};
                const pointR = {x: grid[row][width - 1].x + cellsize, y: grid[row][width - 1].y};
                const [leftX, leftY] = this.project(pointL.x, pointL.y);
                labels.text(rowLabels[row]).fill(baseColour).opacity(baseOpacity).center(leftX, leftY).transform(this.transformAt(pointL.x, pointL.y));
                const [rightX, rightY] = this.project(pointR.x, pointR.y);
                labels.text(rowLabels[row]).fill(baseColour).opacity(baseOpacity).center(rightX, rightY).transform(this.transformAt(pointR.x, pointR.y));
            }
        }

        // Draw grid lines
        const gridlines = board.group().id("gridlines");

        // Horizontal, top of each row, then bottom line after loop
        let numcols = 1;
        if (tilex > 0) {
            numcols = Math.floor(width / tilex);
        }
        for (let tileCol = 0; tileCol < numcols; tileCol++) {
            let idxLeft = 0;
            if (tilex > 0) {
                idxLeft = tileCol * tilex;
            }
            let idxRight = width - 1;
            if (tilex > 0) {
                idxRight = idxLeft + tilex - 1;
            }
            for (let row = 0; row < height; row++) {
                if ( (this.json.options) && (this.json.options.includes("no-border")) ) {
                    if ( (row === 0) || (row === height - 1) ) {
                        continue;
                    }
                }
                let thisStroke = baseStroke;
                if ( (tiley > 0) && (tileSpace === 0) && (row > 0) && (row % tiley === 0) ) {
                    thisStroke = baseStroke * 3;
                }
                const x1 = grid[row][idxLeft].x - (cellsize / 2);
                const y1 = grid[row][idxLeft].y - (cellsize / 2);
                const x2 = grid[row][idxRight].x + (cellsize / 2);
                const y2 = grid[row][idxRight].y - (cellsize / 2);
                const [x1p, y1p] = this.project(x1, y1);
                const [x2p, y2p] = this.project(x2, y2);
                gridlines.line(x1p, y1p, x2p, y2p).stroke({width: thisStroke, color: baseColour, opacity: baseOpacity});

                // if ( (row === height - 1) || ( (tiley > 0) && (tileSpace > 0) && ( (row > 0) || (tiley === 1) ) && (row % tiley === tiley - 1) ) ) {
                if ( row === height - 1 ) {
                    const lastx1 = grid[row][idxLeft].x - (cellsize / 2);
                    const lasty1 = grid[row][idxLeft].y + (cellsize / 2);
                    const lastx2 = grid[row][idxRight].x + (cellsize / 2);
                    const lasty2 = grid[row][idxRight].y + (cellsize / 2);
                    const [lastx1p, lasty1p] = this.project(lastx1, lasty1);
                    const [lastx2p, lasty2p] = this.project(lastx2, lasty2);
                    gridlines.line(lastx1p, lasty1p, lastx2p, lasty2p).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity});
                }
            }
        }

        // Vertical, left of each column, then right line after loop
        let numrows = 1;
        if (tiley > 0) {
            numrows = Math.floor(height / tiley);
        }
        for (let tileRow = 0; tileRow < numrows; tileRow++) {
            let idxTop = 0;
            if (tiley > 0) {
                idxTop = tileRow * tiley;
            }
            let idxBottom = height - 1;
            if (tiley > 0) {
                idxBottom = idxTop + tiley - 1;
            }
            for (let col = 0; col < width; col++) {
                if ( (this.json.options) && (this.json.options.includes("no-border")) ) {
                    if ( (col === 0) || (col === width - 1) ) {
                        continue;
                    }
                }

                let thisStroke = baseStroke;
                if ( (tilex > 0) && (tileSpace === 0) && (col > 0) && (col % tilex === 0) ) {
                    thisStroke = baseStroke * 3;
                }
                const x1 = grid[idxTop][col].x - (cellsize / 2);
                const y1 = grid[idxTop][col].y - (cellsize / 2);
                const x2 = grid[idxBottom][col].x - (cellsize / 2);
                const y2 = grid[idxBottom][col].y + (cellsize / 2);
                const [x1p, y1p] = this.project(x1, y1);
                const [x2p, y2p] = this.project(x2, y2);
                gridlines.line(x1p, y1p, x2p, y2p).stroke({width: thisStroke, color: baseColour, opacity: baseOpacity});

                // if ( (col === width - 1) || ( (tilex > 0) && (tileSpace > 0) && ( (col > 0) || (tilex === 1) ) && (col % tilex === tilex - 1) ) ) {
                if ( col === width - 1 ) {
                    const lastx1 = grid[idxTop][col].x + (cellsize / 2);
                    const lasty1 = grid[idxTop][col].y - (cellsize / 2);
                    const lastx2 = grid[idxBottom][col].x + (cellsize / 2);
                    const lasty2 = grid[idxBottom][col].y + (cellsize / 2);
                    const [lastx1p, lasty1p] = this.project(lastx1, lasty1);
                    const [lastx2p, lasty2p] = this.project(lastx2, lasty2);
                    gridlines.line(lastx1p, lasty1p, lastx2p, lasty2p).stroke({width: baseStroke, color: baseColour, opacity: baseOpacity});
                }
            }
        }

        /*
        if ( (this.options.boardClick !== undefined) && (tileSpace === 0) ) {
            const originX = grid[0][0].x;
            const originY = grid[0][0].y;
            const root = this.rootSvg;
            let genericCatcher = ((e: { clientX: number; clientY: number; }) => {
                const point = root.point(e.clientX, e.clientY);
                const x = Math.floor((point.x - (originX - (cellsize / 2))) / cellsize);
                const y = Math.floor((point.y - (originY - (cellsize / 2))) / cellsize);
                if (x >= 0 && x < width && y >= 0 && y < height) {
                    let idx = -1;
                    if (blocked !== undefined) {
                        idx = blocked.findIndex(o => o.col === x && o.row === y);
                    }
                    if (idx === -1) {
                        this.options.boardClick!(y, x, "");
                    }
                }
            });
            if (this.options.rotate === 180) {
                genericCatcher = ((e: { clientX: number; clientY: number; }) => {
                    const point = root.point(e.clientX, e.clientY);
                    const x = width - Math.floor((point.x - (originX - (cellsize / 2))) / cellsize) - 1;
                    const y = height - Math.floor((point.y - (originY - (cellsize / 2))) / cellsize) - 1;
                    if (x >= 0 && x < width && y >= 0 && y < height) {
                        let idx = -1;
                        if (blocked !== undefined) {
                            idx = blocked.findIndex(o => o.col === x && o.row === y);
                        }
                        if (idx === -1) {
                            this.options.boardClick!(y, x, "");
                        }
                    }
                });
            }
            this.rootSvg.click(genericCatcher);
        }
        */

        return grid;
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
        if (! ("style" in this.json.board)) {
            throw new Error(`This 'board' schema cannot be handled by the '${ Stacking3DRenderer.rendererName }' renderer.`);
        }

        // Load all the pieces in the legend (have to do this early so the glyphs are available for marking the board)
        this.loadLegend();

        switch (this.json.board.style) {
            case "squares":
                gridPoints = this.squaresInPerspective();
                break;
            default:
                throw new Error(`The requested board style (${ this.json.board.style }) is not supported by the '${ Stacking3DRenderer.rendererName }' renderer.`);
        }

        // PIECES
        const group = this.rootSvg.group().id("pieces");
        if (this.json.pieces !== null) {
            // Generate pieces array
            let pieces: string[][][] = [];

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

            // Place the pieces according to the grid
            let offsetPercent = 0.167;
            if ( ("stackOffset" in this.json.board) && (this.json.board.stackOffset !== undefined) ) {
                offsetPercent = this.json.board.stackOffset;
            }
            const offset = this.cellsize * offsetPercent;
            // if the board is rotated, you have to place the pieces in reverse row order
            // for now the code is duplicated
            if (this.options.rotate === 180) {
                // for (let row = 0; row < pieces.length; row++) {
                for (let row = pieces.length - 1; row >= 0; row--) {
                    for (let col = 0; col < pieces[row].length; col++) {
                        for (let i = 0; i < pieces[row][col].length; i++) {
                            const key = pieces[row][col][i];
                            if ( (key !== null) && (key !== "-") ) {
                                const point = gridPoints[row][col];
                                const piece = this.rootSvg.findOne("#" + key) as Svg;
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
                                const use = group.use(piece);
                                const factor = (this.cellsize / sheetCellSize) * 0.85;
                                const newsize = sheetCellSize * factor;
                                const delta = this.cellsize - newsize;
                                const newx = point.x - (this.cellsize / 2) + (delta / 2);
                                const newy = point.y - this.cellsize + (delta / 2);
                                const newp = this.project(newx, newy);
                                const newxp = newp[0];
                                let newyp = newp[1];
                                const ps = this.scaleAt(newx, newy);
                                newyp = newyp - ps * (offset * i);
                                use.dmove(newxp, newyp);
                                use.scale(ps * factor, newxp, newyp);
                                if (this.options.boardClick !== undefined) {
                                    use.click((e : Event) => {this.options.boardClick!(row, col, i.toString()); e.stopPropagation();});
                                }
                            }
                        }
                    }
                }
            } else {
                for (let row = 0; row < pieces.length; row++) {
                    for (let col = 0; col < pieces[row].length; col++) {
                        for (let i = 0; i < pieces[row][col].length; i++) {
                            const key = pieces[row][col][i];
                            if ( (key !== null) && (key !== "-") ) {
                                const point = gridPoints[row][col];
                                const piece = this.rootSvg.findOne("#" + key) as Svg;
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
                                let [newx, newy] = this.project(point.x, point.y);
                                const ps = this.scaleAt(newx, newy);
                                const use = group.use(piece);
                                const factor = ps * this.cellsize / sheetCellSize;
                                const newsize = sheetCellSize * factor;
                                const delta = this.cellsize - newsize;
                                newx = newx - (this.cellsize / 2) + (delta / 2);
                                newy = newy - (this.cellsize / 2) + (delta / 2) - ps * (offset * i);
                                use.dmove(newx, newy);
                                use.scale(factor, newx, newy);
                                if (this.options.boardClick !== undefined) {
                                    use.click((e : Event) => {this.options.boardClick!(row, col, i.toString()); e.stopPropagation();});
                                }
                            }
                        }
                    }
                }
            }
        }

        // annotations
        /*
        if (this.options.showAnnotations) {
            this.annotateBoard(gridPoints);
        }
        */

        // button bar
        this.placeButtonBar(gridPoints);

        // key
        this.placeKey(gridPoints);
    }
}
