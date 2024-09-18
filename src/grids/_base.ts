// import { Nested } from "@svgdotjs/svg.js";
// import { SVG } from "@svgdotjs/svg.js";

/**
 * A simple x,y coordinate container.
 *
 */
export interface IPoint {
    readonly x: number;
    readonly y: number;
}

export type PentagonOrientation = "H"|"V";
export type SnubStart = "S"|"T"; // square or triangle

/**
 * Defines the options accepted by every grid point generator.
 *
 */
export interface IGeneratorArgs {
    /**
     * The width of the individual cells.
     *
     */
    readonly cellWidth?: number;
    /**
     * The height of the individual cells.
     *
     */
    readonly cellHeight?: number;
    /**
     * If given, overrides `cellWidth` and `cellHeight` and assumes the cell is square.
     *
     */
    readonly cellSize?: number;
    /**
     * Different generators use different methods for deriving the grid, and by default
     * the generators don't care what the top-left coordinate is. If it's important to the renderer for some reason,
     * then you can request the points be translated so that the top-left matches a given coordinate.
     * Not respected by all generators.
     * This sets the starting x coordinate.
     *
     */
    readonly startx?: number;
    /**
     * Different generators use different methods for deriving the grid, and by default
     * the generators don't care what the top-left coordinate is. If it's important to the renderer for some reason,
     * then you can request the points be translated so that the top-left matches a given coordinate.
     * Not respected by all generators.
     * This sets the starting y coordinate.
     *
     */
    readonly starty?: number;
    /**
     * The number of cells wide the resulting field will be.
     *
     */
    readonly gridWidth?: number;
    /**
     * The number of cells high the resulting field will be.
     *
     */
    readonly gridHeight?: number;
    /**
     * The `hexOf*` generators are not a fixed width. This sets the minimum width of the field.
     *
     */
    readonly gridWidthMin?: number;
    /**
     * The `hexOf*` generators are not a fixed width. This sets the maximum width of the field.
     *
     */
    readonly gridWidthMax?: number;
    /**
     * If given, the field will be split up into multiple separated fields this number of cells high.
     *
     */
    readonly tileHeight?: number;
    /**
     * If given, the field will be split up into multiple separated fields this number of cells wide.
     *
     */
    readonly tileWidth?: number;
    /**
     * Combined with `tileWidth` or `tileHeight`, this defines the separation between fields,
     * expressed as a percentage of `cellWidth`, `cellHeight`, or `cellSize`.
     *
     */
    readonly tileSpacing?: number;
    /**
     * Used by `hex-of-*` generators if you just want the top or bottom half of the hex
     * (e.g., for making simple triangular shapes, and even some rhomboids).
     *
     */
    readonly half?: "top"|"bottom";
    /**
     * Used by `hex-of-*` generators to create boards with alternating side lengths.
     */
    readonly alternating?: boolean;
    /**
     * Only used by the cairo generator to determine starting orientation
     */
    readonly cairoStart?: PentagonOrientation;
    /**
     * Only used by the snubsquare generator to determine the top-left cell shape
     */
    readonly snubStart?: SnubStart;
    /**
     * Only used by the conicalHex generator to determine whether you want the narrow or wide variant.
     */
    readonly conicalNarrow?: boolean;
}

/**
 * What every grid generator returns.
 */
export type GridPoints = Array<Array<IPoint>>;

export interface IPolyPath {
    type: "path";
    path: string;
    points: IPoint[];
}
export interface IPolyPolygon {
    type: "poly";
    points: IPoint[];
}
export interface IPolyCircle {
    type: "circle";
    cx: number;
    cy: number;
    r: number;
}
export type Poly = IPolyCircle|IPolyPath|IPolyPolygon;

/**
 * The definition of a grid generator. It accepts a list of `IGeneratorArgs` and returns `GridPoints`
 * that maps rows and columns to x,y coordinates.
 * @param args - Generator options
 * @returns A map of x,y coordinates to row/column locations
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
