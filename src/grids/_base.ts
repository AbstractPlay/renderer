// import { Nested } from "@svgdotjs/svg.js";
// import { SVG } from "@svgdotjs/svg.js";

/**
 * A simple x,y coordinate container.
 *
 * @export
 * @interface IPoint
 */
export interface IPoint {
    readonly x: number;
    readonly y: number;
}

/**
 * Defines the options accepted by every grid point generator.
 *
 * @export
 * @interface IGeneratorArgs
 */
export interface IGeneratorArgs {
    /**
     * The width of the individual cells.
     *
     * @type {number}
     * @memberof IGeneratorArgs
     */
    readonly cellWidth?: number;
    /**
     * The height of the individual cells.
     *
     * @type {number}
     * @memberof IGeneratorArgs
     */
    readonly cellHeight?: number;
    /**
     * If given, overrides `cellWidth` and `cellHeight` and assumes the cell is square.
     *
     * @type {number}
     * @memberof IGeneratorArgs
     */
    readonly cellSize?: number;
    /**
     * Different generators use different methods for deriving the grid, and by default
     * the generators don't care what the top-left coordinate is. If it's important to the renderer for some reason,
     * then you can request the points be translated so that the top-left matches a given coordinate.
     * Not respected by all generators.
     * This sets the starting x coordinate.
     *
     * @type {number}
     * @memberof IGeneratorArgs
     */
    readonly startx?: number;
    /**
     * Different generators use different methods for deriving the grid, and by default
     * the generators don't care what the top-left coordinate is. If it's important to the renderer for some reason,
     * then you can request the points be translated so that the top-left matches a given coordinate.
     * Not respected by all generators.
     * This sets the starting y coordinate.
     *
     * @type {number}
     * @memberof IGeneratorArgs
     */
    readonly starty?: number;
    /**
     * The number of cells wide the resulting field will be.
     *
     * @type {number}
     * @memberof IGeneratorArgs
     */
    readonly gridWidth?: number;
    /**
     * The number of cells high the resulting field will be.
     *
     * @type {number}
     * @memberof IGeneratorArgs
     */
    readonly gridHeight?: number;
    /**
     * The `hexOf*` generators are not a fixed width. This sets the minimum width of the field.
     *
     * @type {number}
     * @memberof IGeneratorArgs
     */
    readonly gridWidthMin?: number;
    /**
     * The `hexOf*` generators are not a fixed width. This sets the maximum width of the field.
     *
     * @type {number}
     * @memberof IGeneratorArgs
     */
    readonly gridWidthMax?: number;
    /**
     * If given, the field will be split up into multiple separated fields this number of cells high.
     *
     * @type {number}
     * @memberof IGeneratorArgs
     */
    readonly tileHeight?: number;
    /**
     * If given, the field will be split up into multiple separated fields this number of cells wide.
     *
     * @type {number}
     * @memberof IGeneratorArgs
     */
    readonly tileWidth?: number;
    /**
     * Combined with `tileWidth` or `tileHeight`, this defines the separation between fields,
     * expressed as a percentage of `cellWidth`, `cellHeight`, or `cellSize`.
     *
     * @type {number}
     * @memberof IGeneratorArgs
     */
    readonly tileSpacing?: number;
}

/**
 * What every grid generator returns.
 */
export type GridPoints = Array<Array<IPoint>>;

/**
 * The definition of a grid generator. It accepts a list of {IGeneratorArgs} and returns {GridPoints}
 * that maps rows and columns to x,y coordinates.
 */
export type GridGenerator = (args: IGeneratorArgs) => GridPoints;

export const normalizeX = (inGrid: GridPoints): GridPoints => {
    let minX = 0;
    inGrid.forEach((row) => {
        minX = Math.min(minX, row[0].x);
    });
    const newGrid: GridPoints = [];
    for (const row of inGrid) {
        const node: IPoint[] = [];
        for (const p of row) {
            const newp: IPoint = {x: p.x + Math.abs(minX), y: p.y};
            node.push(newp);
        }
        newGrid.push(node);
    }

    return newGrid;
}
