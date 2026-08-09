import { StrokeData } from "@svgdotjs/svg.js";
import { GridPoints, IPolyPolygon } from "../grids";
import { RendererBase } from "../renderers/_base";
import { centroid } from "../common/plotting";
import { BoardReturn, getBoardFill } from ".";

const FRACTURED_FLAT_PADDING = 8;

const RAW_FRACTURED_FLAT_POLYS = JSON.parse(`[{"type":"poly","points":[{"x":674.01,"y":164.72},{"x":784.32,"y":164.72},{"x":758.49,"y":257.09}]},{"type":"poly","points":[{"x":674.01,"y":164.72},{"x":758.49,"y":257.09},{"x":674.01,"y":272.58}]},{"type":"poly","points":[{"x":784.32,"y":164.72},{"x":758.49,"y":257.09},{"x":847.93,"y":261.02},{"x":848.18,"y":164.72}]},{"type":"poly","points":[{"x":847.93,"y":261.02},{"x":848.18,"y":164.72},{"x":938.33,"y":238.74},{"x":910.89,"y":334.07}]},{"type":"poly","points":[{"x":848.18,"y":164.72},{"x":1138.12,"y":164.72},{"x":1007.12,"y":240.21},{"x":938.33,"y":238.74}]},{"type":"poly","points":[{"x":1007.12,"y":240.21},{"x":1138.12,"y":164.72},{"x":1155.45,"y":297.43}]},{"type":"poly","points":[{"x":1138.12,"y":164.72},{"x":1155.45,"y":297.43},{"x":1245.12,"y":164.72}]},{"type":"poly","points":[{"x":1155.45,"y":297.43},{"x":1245.12,"y":346.88},{"x":1245.12,"y":164.72}]},{"type":"poly","points":[{"x":1245.12,"y":346.88},{"x":1155.45,"y":297.43},{"x":1170.73,"y":430.48}]},{"type":"poly","points":[{"x":1155.45,"y":297.43},{"x":1170.73,"y":430.48},{"x":1091.6,"y":353.72}]},{"type":"poly","points":[{"x":1155.45,"y":297.43},{"x":1091.6,"y":353.72},{"x":1014.76,"y":335.41},{"x":1007.12,"y":240.21}]},{"type":"poly","points":[{"x":938.33,"y":238.74},{"x":1007.12,"y":240.21},{"x":1014.76,"y":335.41},{"x":971.46,"y":406.94},{"x":910.89,"y":334.07}]},{"type":"poly","points":[{"x":834.65,"y":345.07},{"x":847.93,"y":261.02},{"x":910.89,"y":334.07}]},{"type":"poly","points":[{"x":834.65,"y":345.07},{"x":847.93,"y":261.02},{"x":758.49,"y":257.09},{"x":745.86,"y":315.47}]},{"type":"poly","points":[{"x":758.49,"y":257.09},{"x":745.86,"y":315.47},{"x":674.01,"y":392.11},{"x":674.01,"y":272.58}]},{"type":"poly","points":[{"x":745.86,"y":315.47},{"x":674.01,"y":392.11},{"x":794.88,"y":392.42},{"x":834.65,"y":345.07}]},{"type":"poly","points":[{"x":794.88,"y":392.42},{"x":834.65,"y":345.07},{"x":910.89,"y":334.07},{"x":971.46,"y":406.94},{"x":892.52,"y":448.61}]},{"type":"poly","points":[{"x":971.46,"y":406.94},{"x":1014.76,"y":335.41},{"x":1091.6,"y":353.72},{"x":1089.77,"y":430.51},{"x":1041.58,"y":454.07}]},{"type":"poly","points":[{"x":1091.6,"y":353.72},{"x":1170.73,"y":430.48},{"x":1118.67,"y":546.54},{"x":1089.77,"y":430.51}]},{"type":"poly","points":[{"x":1170.73,"y":430.48},{"x":1245.12,"y":346.88},{"x":1245.12,"y":578.56}]},{"type":"poly","points":[{"x":1170.73,"y":430.48},{"x":1118.67,"y":546.54},{"x":1245.12,"y":578.56}]},{"type":"poly","points":[{"x":1089.77,"y":430.51},{"x":1118.67,"y":546.54},{"x":1048.9,"y":538.25},{"x":1041.58,"y":454.07}]},{"type":"poly","points":[{"x":971.46,"y":406.94},{"x":1041.58,"y":454.07},{"x":1048.9,"y":538.25},{"x":971.9,"y":583.67},{"x":890.72,"y":537.18},{"x":892.52,"y":448.61}]},{"type":"poly","points":[{"x":892.52,"y":448.61},{"x":890.72,"y":537.18},{"x":821.05,"y":476.72},{"x":794.88,"y":392.42}]},{"type":"poly","points":[{"x":821.05,"y":476.72},{"x":890.72,"y":537.18},{"x":820.32,"y":577.12}]},{"type":"poly","points":[{"x":820.32,"y":577.12},{"x":734.78,"y":550.47},{"x":794.88,"y":392.42},{"x":821.05,"y":476.72}]},{"type":"poly","points":[{"x":794.88,"y":392.42},{"x":734.78,"y":550.47},{"x":674.01,"y":392.11}]},{"type":"poly","points":[{"x":674.01,"y":392.11},{"x":734.78,"y":550.47},{"x":674.01,"y":703.58}]},{"type":"poly","points":[{"x":674.01,"y":703.58},{"x":762.71,"y":651.56},{"x":734.78,"y":550.47}]},{"type":"poly","points":[{"x":762.71,"y":651.56},{"x":734.78,"y":550.47},{"x":820.32,"y":577.12},{"x":836.21,"y":660.31}]},{"type":"poly","points":[{"x":836.21,"y":660.31},{"x":820.32,"y":577.12},{"x":890.72,"y":537.18},{"x":971.9,"y":583.67},{"x":979.62,"y":669.31}]},{"type":"poly","points":[{"x":979.62,"y":669.31},{"x":971.9,"y":583.67},{"x":1048.9,"y":538.25},{"x":1118.67,"y":546.54},{"x":1111.38,"y":652.03}]},{"type":"poly","points":[{"x":1118.67,"y":546.54},{"x":1111.38,"y":652.03},{"x":1245.12,"y":578.56}]},{"type":"poly","points":[{"x":1245.12,"y":578.56},{"x":1165.77,"y":728.01},{"x":1245.12,"y":844.43}]},{"type":"poly","points":[{"x":1245.12,"y":578.56},{"x":1165.77,"y":728.01},{"x":1111.38,"y":652.03}]},{"type":"poly","points":[{"x":1165.77,"y":728.01},{"x":1245.12,"y":844.43},{"x":1074.37,"y":844.43}]},{"type":"poly","points":[{"x":1165.77,"y":728.01},{"x":1074.37,"y":844.43},{"x":1043.36,"y":735.38}]},{"type":"poly","points":[{"x":979.62,"y":669.31},{"x":1111.38,"y":652.03},{"x":1165.77,"y":728.01},{"x":1043.36,"y":735.38}]},{"type":"poly","points":[{"x":1043.36,"y":735.38},{"x":1074.37,"y":844.43},{"x":903.32,"y":775.61}]},{"type":"poly","points":[{"x":979.62,"y":669.31},{"x":1043.36,"y":735.38},{"x":903.32,"y":775.61}]},{"type":"poly","points":[{"x":979.62,"y":669.31},{"x":903.32,"y":775.61},{"x":845.86,"y":737.34},{"x":836.21,"y":660.31}]},{"type":"poly","points":[{"x":903.32,"y":775.61},{"x":1074.37,"y":844.43},{"x":674.01,"y":844.43}]},{"type":"poly","points":[{"x":845.86,"y":737.34},{"x":903.32,"y":775.61},{"x":674.01,"y":844.43}]},{"type":"poly","points":[{"x":836.21,"y":660.31},{"x":845.86,"y":737.34},{"x":674.01,"y":844.43}]},{"type":"poly","points":[{"x":836.21,"y":660.31},{"x":762.71,"y":651.56},{"x":674.01,"y":703.58},{"x":674.01,"y":844.43}]}]`) as IPolyPolygon[];

export function translateFracturedFlatPolys(raw: IPolyPolygon[], padding = FRACTURED_FLAT_PADDING): IPolyPolygon[] {
    const all = raw.flatMap((p) => p.points);
    const minX = Math.min(...all.map((pt) => pt.x));
    const minY = Math.min(...all.map((pt) => pt.y));
    const dx = minX - padding;
    const dy = minY - padding;
    return raw.map((poly) => ({
        type: "poly",
        points: poly.points.map((pt) => ({ x: pt.x - dx, y: pt.y - dy })),
    }));
}

export function orderFracturedFlatPolys(raw: IPolyPolygon[]): IPolyPolygon[][] {
    const sorted = [...raw].sort((a, b) => {
        const va = a.points.length;
        const vb = b.points.length;
        if (va !== vb) {
            return va - vb;
        }
        const ca = centroid(a.points)!;
        const cb = centroid(b.points)!;
        if (ca.y !== cb.y) {
            return ca.y - cb.y;
        }
        return ca.x - cb.x;
    });
    const rows: IPolyPolygon[][] = [];
    let row: IPolyPolygon[] = [];
    let vertexCount = -1;
    for (const poly of sorted) {
        const count = poly.points.length;
        if (count !== vertexCount) {
            if (row.length > 0) {
                rows.push(row);
            }
            row = [poly];
            vertexCount = count;
        } else {
            row.push(poly);
        }
    }
    if (row.length > 0) {
        rows.push(row);
    }
    return rows;
}

export function prepareFracturedFlatPolys(): IPolyPolygon[][] {
    return orderFracturedFlatPolys(translateFracturedFlatPolys(RAW_FRACTURED_FLAT_POLYS));
}

/**
 * Hand-authored fractured polygon board. Cells are indexed by size tier (row) then
 * centroid Y, then centroid X within each tier.
 */
export const fracturedFlat = (ctx: RendererBase): BoardReturn => {
    if ((ctx.json === undefined) || (ctx.rootSvg === undefined)) {
        throw new Error("Object in an invalid state!");
    }

    if (ctx.json.board === undefined || ctx.json.board === null) {
        throw new Error("The board property must exist.");
    }

    let baseStroke = 1;
    let baseColour = ctx.options.colourContext.strokes;
    let baseOpacity = 1;
    if ("strokeWeight" in ctx.json.board && ctx.json.board.strokeWeight !== undefined) {
        baseStroke = ctx.json.board.strokeWeight;
    }
    if ("strokeColour" in ctx.json.board && ctx.json.board.strokeColour !== undefined) {
        baseColour = ctx.resolveColour(ctx.json.board.strokeColour) as string;
    }
    if ("strokeOpacity" in ctx.json.board && ctx.json.board.strokeOpacity !== undefined) {
        baseOpacity = ctx.json.board.strokeOpacity;
    }
    const strokeAttrs: StrokeData = {color: baseColour, width: baseStroke, opacity: baseOpacity, linecap: "round", linejoin: "round"};

    const polys = prepareFracturedFlatPolys();
    const grid: GridPoints = polys.map((row) => row.map((cell) => centroid(cell.points)!));
    const board = ctx.rootSvg.group().id("board");
    const gridlines = board.group().id("gridlines");

    const [hexFill, hexOpacity] = getBoardFill(ctx, "white");
    for (let y = 0; y < polys.length; y++) {
        const row = polys[y];
        for (let x = 0; x < row.length; x++) {
            const cell = row[x];
            gridlines.polygon(cell.points.map((pt) => `${pt.x},${pt.y}`).join(" ")).fill({color: hexFill, opacity: hexOpacity}).stroke("none");
        }
    }

    ctx.markBoard({svgGroup: gridlines, preGridLines: true, grid, polys});

    for (let y = 0; y < polys.length; y++) {
        const row = polys[y];
        for (let x = 0; x < row.length; x++) {
            const cell = row[x];
            const ele = gridlines.polygon(cell.points.map((pt) => `${pt.x},${pt.y}`).join(" ")).fill({color: "white", opacity: 0}).stroke(strokeAttrs);
            if (ctx.options.boardClick !== undefined) {
                ele.click(() => ctx.options.boardClick!(y, x, ""));
            }
        }
    }

    ctx.markBoard({svgGroup: gridlines, preGridLines: false, grid, polys});

    return {grid, polys};
};
