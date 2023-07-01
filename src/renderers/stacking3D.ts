import { GridPoints } from "../grids/_base";
import { APRenderRep } from "../schemas/schema";
import { IRendererOptionsIn, RendererBase } from "./_base";
import { rectOfRects } from "../grids";
import { Svg, StrokeData } from "@svgdotjs/svg.js";

/**
 * Internal interface when placing markers and annotations
 *
 */
interface ITarget {
    row: number;
    col: number;
}

/**
 * A simple x,y coordinate container.
 *
 */
/*
export interface IPoint {
    readonly x: number;
    readonly y: number;
}
*/

/**
 * The `stacking-3D` renderer creates a square board seen in perspective. Stacks of pieces therefore does not (fully) obscure stacks behind them.
 *
 */
export class Stacking3DRenderer extends RendererBase {

    public static readonly rendererName: string = "stacking-3D";
    // But see findaft() below.
    private f = -1;
    private a = 1;
    private t = Math.PI - 0.4 * Math.PI;

    private width = 0;
    private height = 0;

    constructor() {
        super();
    }

    // If lower left is at (0,0), lower right at (1,0), map upper left to (x1, y), upper right to (x2, y).
    // Make sure 0.5 < x2 - x1 < 1 and 0 < y < 2 * (x2 - x1) - 1.
    private findaft(x1: number, x2: number, y:number): void {
      if (y <= 0)
        throw new Error("y must be positive");
      y = y + 1;
      const b = x2 - x1;
      if (b >= 1)
        throw new Error("x2 - x1 must be less than 1");
      if (b <= 0.5)
        throw new Error("x2 - x1 must be greater than 0.5");
      const a = x1 / (b - 1);
      if (y / b - 1 > 1)
        throw new Error("y must be less than 2 * (x2 - x1) - 1");
      const t = Math.asin(y / b - 1);
      const f = Math.cos(t) / (1 / b - 1);
      this.f = f;
      this.a = a;
      this.t = t;
    }

    private project0(p: [number, number, number]): [number, number] {
        return [p[0] * this.f / p[2], p[1] * this.f / p[2]];
    }

    private projectUnscaled(x0: number, y0: number): [number, number] {
      const p4: [number, number, number] = [1 + x0 / this.a, 1 / this.a * (1 + y0 * Math.sin(this.t)), this.f / this.a + y0 / this.a * Math.cos(this.t)];
      const p4p = this.project0(p4);
      return [p4p[0] - this.a, p4p[1] - 1];
    }

    private unProjectUnscaled(x0: number, y0: number): [number, number] {
      const y = y0 / (Math.sin(this.t) - Math.cos(this.t) * (y0 + 1) / this.f);
      const x = (x0 + this.a) * (1 + y * Math.cos(this.t) / this.f) - this.a;
      return [x, y];
    }

    private test(x: number, y: number): void {
      const p = this.projectUnscaled(x, y);
      const p2 = this.unProjectUnscaled(p[0], p[1]);
      if (Math.abs(p2[0] - x) > 0.0001 || Math.abs(p2[1] - y) > 0.0001)
        throw new Error("test failed");
    }

    private project(x0: number, y0: number): [number, number] {
      const scaleX = this.cellsize * this.width;
      const scaleY = this.cellsize * this.height;
      const p = this.projectUnscaled(x0 / scaleX, 1 - y0 / scaleY);
      return [scaleX * p[0], scaleY * (1 - p[1])];
    }

    // Returns the SVG transform that maps project(x0, y0) to project(x0, y0), project(x0, y0) - (t, 0) to project(x0 - t, y0), and project(x0, y0) + (0, t) to project(x0, y0 + t).
    private transformAt(x0: number, y0: number, t: number = this.cellsize / 10): {a: number, b: number, c: number, d: number, e: number, f: number} {
      const [x, y] = this.project(x0, y0);
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

    // The SVG transform that matches the projection at the 3 given points.
    private transformAt3(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number):
        {a: number, b: number, c: number, d: number, e: number, f: number} {
        const [u1, v1] = this.project(x1, y1);
        const [u2, v2] = this.project(x2, y2);
        const [u3, v3] = this.project(x3, y3);
        const den = x2*y1 - x3*y1 - x1*y2 + x3*y2 + x1*y3 - x2*y3;
        const a = -((-(u2*y1) + u3*y1 + u1*y2 - u3*y2 - u1*y3 + u2*y3)/den);
        const b = -((-(v2*y1) + v3*y1 + v1*y2 - v3*y2 - v1*y3 + v2*y3)/den);
        const c = (-(u2*x1) + u3*x1 + u1*x2 - u3*x2 - u1*x3 + u2*x3)/den;
        const d = -(v2*x1 - v3*x1 - v1*x2 + v3*x2 + v1*x3 - v2*x3)/den;
        const e = (u3*x2*y1 - u2*x3*y1 - u3*x1*y2 + u1*x3*y2 + u2*x1*y3 - u1*x2*y3)/den;
        const f = -(-(v3*x2*y1) + v2*x3*y1 + v3*x1*y2 - v1*x3*y2 - v2*x1*y3 + v1*x2*y3)/den;
        return { a, b, c, d, e, f };
    }

    private scaleAt(x0: number, y0: number): number {
      const cellsize = this.cellsize;
      const [x] = this.project(x0, y0);
      const t = cellsize / 10;
      const [x2] = this.project(x0 - t, y0);
      return (x - x2) / t;
    }

        /**
     * An internal helper function for generating `eject` annotations.
     * This is not generalized. It only assumes we are rotating in increments of 45 degrees.
     *
     * @param from - Starting point
     * @param to - Ending point
     * @param delta - The depth of the arc
     * @returns The midpoint of the arc
     */
    /*
    private getArcCentre(from: IPoint, to: IPoint, delta: number): IPoint {
        const m: IPoint = {x: (from.x + to.x) / 2, y: (from.y + to.y) / 2};
        let dir = "";
        if (to.y < from.y) {
            dir = "N";
        } else if (to.y > from.y) {
            dir = "S";
        }
        if (to.x < from.x) {
            dir += "W";
        } else if (to.x > from.x) {
            dir += "E";
        }
        switch (dir) {
            case "N":
            case "S":
            case "NE":
            case "SW":
                return {x: m.x + delta, y: m.y};
            case "E":
            case "W":
            case "NW":
            case "SE":
                return {x: m.x, y: m.y + delta};
            default:
                throw new Error(`Unrecognized direction ${dir}`);
        }
    }
    */

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

        this.findaft(-0.25, 0.6, 0.6);
        this.test(0.3, 0.55);

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

    /**
     * This applies annotations to a board.
     * Annotations are applied to the board, "under" the pieces.
     *
     * @param grid - A map of row/column locations to x,y coordinates
     */
    protected annotateBoard(grid: GridPoints) {
        if ( (this.json === undefined) || (this.rootSvg === undefined) ) {
            throw new Error("Object in an invalid state!");
        }

        if ( ("annotations" in this.json) && (this.json.annotations !== undefined) ) {
            const notes = this.rootSvg.group().id("annotations");
            const rIncrement = this.cellsize / 2;
            let radius = rIncrement;
            let direction = 1;
            for (const note of this.json.annotations) {
                if ( (note.type !== undefined) && (note.type === "move") ) {
                    if ((note.targets as any[]).length < 2) {
                        throw new Error("Move annotations require at least two 'targets'.");
                    }

                    let colour = "#000";
                    if ( ("colour" in note) && (note.colour !== undefined) ) {
                        colour = note.colour as string;
                    } else if ( ("player" in note) && (note.player !== undefined) ) {
                        colour = this.options.colours[(note.player as number) - 1];
                    }
                    let style = "solid";
                    if ( ("style" in note) && (note.style !== undefined) ) {
                        style = note.style as string;
                    }
                    let arrow = true;
                    if ( ("arrow" in note) && (note.arrow !== undefined)) {
                        arrow = note.arrow as boolean;
                    }
                    let opacity = 1;
                    if ( ("opacity" in note) && (note.opacity !== undefined) ) {
                        opacity = note.opacity as number;
                    }

                    const markerArrow = notes.marker(4, 4, (add) => add.path("M0,0 L4,2 0,4").fill(colour));
                    const markerCircle = notes.marker(2, 2, (add) => add.circle(2).fill(colour));
                    const points: [number, number][] = [];
                    for (const node of (note.targets as ITarget[])) {
                        const pt = grid[node.row][node.col];
                        const ptp = this.project(pt.x, pt.y);
                        points.push([ptp[0],ptp[1]]);
                    }
                    const stroke: StrokeData = {
                        color: colour,
                        opacity,
                        width: this.cellsize * 0.015,
                    };
                    if (style === "dashed") {
                        stroke.dasharray = "4";
                    }
                    const line = notes.polyline(points).stroke(stroke).fill("none");
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

                    let colour = "#000";
                    if ( ("colour" in note) && (note.colour !== undefined) ) {
                        colour = note.colour as string;
                    } else if ( ("player" in note) && (note.player !== undefined) ) {
                        colour = this.options.colours[(note.player as number) - 1];
                    }
                    let style = "dashed";
                    if ( ("style" in note) && (note.style !== undefined) ) {
                        style = note.style as string;
                    }
                    let arrow = false;
                    if ( ("arrow" in note) && (note.arrow !== undefined)) {
                        arrow = note.arrow as boolean;
                    }
                    let opacity = 0.5;
                    if ( ("opacity" in note) && (note.opacity !== undefined) ) {
                        opacity = note.opacity as number;
                    }

                    // const markerArrow = notes.marker(5, 5, (add) => add.path("M 0 0 L 10 5 L 0 10 z"));
                    const markerArrow = notes.marker(4, 4, (add) => add.path("M0,0 L4,2 0,4").fill(colour));
                    const markerCircle = notes.marker(2, 2, (add) => add.circle(2).fill(colour));
                    const [from, to] = note.targets as ITarget[];
                    const ptFrom = grid[from.row][from.col];
                    const ptTo = grid[to.row][to.col];
                    const ptCtr = this.getArcCentre(ptFrom, ptTo, radius * direction);
                    const stroke: StrokeData = {
                        color: colour,
                        opacity,
                        width: this.cellsize * 0.03,
                    };
                    if (style === "dashed") {
                        stroke.dasharray = "4";
                    }
                    const line = notes.path(`M ${ptFrom.x} ${ptFrom.y} C ${ptCtr.x} ${ptCtr.y} ${ptCtr.x} ${ptCtr.y} ${ptTo.x} ${ptTo.y}`).stroke(stroke).fill("none");
                    line.marker("start", markerCircle);
                    if (arrow) {
                        line.marker("end", markerArrow);
                    } else {
                        line.marker("end", markerCircle);
                    }
                    line.transform(this.transformAt3(ptFrom.x, ptFrom.y, ptCtr.x, ptCtr.y, ptTo.x, ptTo.y));
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
                } else if ( (note.type !== undefined) && (note.type === "enter") ) {
                    let colour = "#000";
                    if ( ("colour" in note) && (note.colour !== undefined) ) {
                        colour = note.colour as string;
                    } else if ( ("player" in note) && (note.player !== undefined) ) {
                        colour = this.options.colours[(note.player as number) - 1];
                    }
                    for (const node of (note.targets as ITarget[])) {
                        const center = grid[node.row][node.col];
                        const x1 = center.x - this.cellsize / 2;
                        const x2 = center.x + this.cellsize / 2;
                        const y1 = center.y - this.cellsize / 2;
                        const y2 = center.y + this.cellsize / 2;
                        const pt1 = this.project(x1, y1);
                        notes.line(pt1[0], pt1[1], pt1[0] + this.cellsize, pt1[1]).transform(this.transformAt(x1, y1, -this.cellsize))
                            .fill("none")
                            .stroke({color: colour, width: this.cellsize * 0.05, dasharray: "4"});
                        const pt2 = this.project(x2, y1);
                        notes.line(pt2[0], pt2[1], pt2[0], pt2[1] + this.cellsize).transform(this.transformAt(x2, y1, this.cellsize))
                            .fill("none")
                            .stroke({color: colour, width: this.cellsize * 0.05, dasharray: "4"});
                        const pt3 = this.project(x2, y2);
                        notes.line(pt3[0], pt3[1], pt3[0] - this.cellsize, pt3[1]).transform(this.transformAt(x2, y2, this.cellsize))
                            .fill("none")
                            .stroke({color: colour, width: this.cellsize * 0.05, dasharray: "4"});
                        const pt4 = this.project(x1, y2);
                        notes.line(pt4[0], pt4[1], pt4[0], pt4[1] - this.cellsize).transform(this.transformAt(x1, y2, - this.cellsize))
                            .fill("none")
                            .stroke({color: colour, width: this.cellsize * 0.05, dasharray: "4"});
                    }
                } else if ( (note.type !== undefined) && (note.type === "exit") ) {
                    let colour = "#000";
                    if ( ("colour" in note) && (note.colour !== undefined) ) {
                        colour = note.colour as string;
                    } else if ( ("player" in note) && (note.player !== undefined) ) {
                        colour = this.options.colours[(note.player as number) - 1];
                    }
                    for (const node of (note.targets as ITarget[])) {
                        const center = grid[node.row][node.col];
                        const x1 = center.x - this.cellsize / 2;
                        const x2 = center.x + this.cellsize / 2;
                        const y1 = center.y - this.cellsize / 2;
                        const y2 = center.y + this.cellsize / 2;
                        const pt1 = this.project(x1, y1);
                        notes.line(pt1[0], pt1[1], pt1[0] + this.cellsize, pt1[1]).transform(this.transformAt(x1, y1, -this.cellsize))
                            .fill("none")
                            .stroke({color: colour, width: this.cellsize * 0.05, dasharray: "4"});
                        const pt2 = this.project(x2, y1);
                        notes.line(pt2[0], pt2[1], pt2[0], pt2[1] + this.cellsize).transform(this.transformAt(x2, y1, this.cellsize))
                            .fill("none")
                            .stroke({color: colour, width: this.cellsize * 0.05, dasharray: "4"});
                        const pt3 = this.project(x2, y2);
                        notes.line(pt3[0], pt3[1], pt3[0] - this.cellsize, pt3[1]).transform(this.transformAt(x2, y2, this.cellsize))
                            .fill("none")
                            .stroke({color: colour, width: this.cellsize * 0.05, dasharray: "4"});
                        const pt4 = this.project(x1, y2);
                        notes.line(pt4[0], pt4[1], pt4[0], pt4[1] - this.cellsize).transform(this.transformAt(x1, y2, - this.cellsize))
                            .fill("none")
                            .stroke({color: colour, width: this.cellsize * 0.05, dasharray: "4"});
                    }
                } else if ( (note.type !== undefined) && (note.type === "dots") ) {
                    let colour = "#000";
                    if ( ("colour" in note) && (note.colour !== undefined) ) {
                        colour = note.colour as string;
                    } else if ( ("player" in note) && (note.player !== undefined) ) {
                        colour = this.options.colours[(note.player as number) - 1];
                    }
                    let opacity = 1;
                    if ( ("opacity" in note) && (note.opacity !== undefined) ) {
                        opacity = note.opacity as number;
                    }
                    for (const node of (note.targets as ITarget[])) {
                        const pt = grid[node.row][node.col];
                        notes.circle(this.cellsize * 0.2)
                            .fill(colour)
                            .opacity(opacity)
                            .stroke({width: 0})
                            .center(pt.x, pt.y);
                    }
                } else {
                    throw new Error(`The requested annotation (${ note.type as string }) is not supported.`);
                }
            }
        }
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
            let offsetPercent = 0.15;
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

        if (this.options.showAnnotations) {
            this.annotateBoard(gridPoints);
        }
    }
}
