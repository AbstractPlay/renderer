// import { Nested } from "@svgdotjs/svg.js";
// import svg from "svg.js";

export interface IPoint {
    readonly x: number;
    readonly y: number;
}

export interface IGeneratorArgs {
    readonly cellWidth?: number;
    readonly cellHeight?: number;
    readonly cellSize?: number;
    readonly gridWidth?: number;
    readonly gridHeight?: number;
    readonly gridWidthMin?: number;
    readonly gridWidthMax?: number;
    readonly offsetX?: number;
    readonly offsetY?: number;
}

export type GridPoints = Array<Array<IPoint>>;

export type GridGenerator = (args: IGeneratorArgs) => GridPoints;
