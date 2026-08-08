import { GridPoints, IPolyPolygon } from "./_base";

export type TileCorner = "nw" | "ne" | "sw" | "se";

export interface SquarePoint {
    row?: number;
    col?: number;
    tileRow?: number;
    tileCol?: number;
    corner?: TileCorner;
}

export interface ResolveSquarePointOpts {
    polys: IPolyPolygon[][];
    gridExpanded: GridPoints;
    tileWidth: number;
    tileHeight: number;
    tileSpacing: number;
    boardWidth: number;
    boardHeight: number;
    interpolate: (point: { row: number; col: number }) => [number, number];
}

export function isTileCornerPoint(point: SquarePoint): point is {
    tileRow: number;
    tileCol: number;
    corner: TileCorner;
} {
    return point.tileRow !== undefined
        && point.tileCol !== undefined
        && point.corner !== undefined;
}

interface TileExtent {
    r0: number;
    c0: number;
    r1: number;
    c1: number;
}

function tileExtent(
    tileRow: number,
    tileCol: number,
    tileWidth: number,
    tileHeight: number,
    tileSpacing: number,
    boardWidth: number,
    boardHeight: number,
): TileExtent | undefined {
    const r0 = tileRow * (tileHeight + tileSpacing);
    const c0 = tileCol * (tileWidth + tileSpacing);
    if (r0 >= boardHeight || c0 >= boardWidth) {
        return undefined;
    }
    return {
        r0,
        c0,
        r1: Math.min(r0 + tileHeight - 1, boardHeight - 1),
        c1: Math.min(c0 + tileWidth - 1, boardWidth - 1),
    };
}

export function tileCornerXY(
    polys: IPolyPolygon[][],
    tileRow: number,
    tileCol: number,
    corner: TileCorner,
    tileWidth: number,
    tileHeight: number,
    tileSpacing: number,
    boardWidth?: number,
    boardHeight?: number,
): [number, number] {
    const height = boardHeight ?? polys.length;
    const width = boardWidth ?? (polys[0]?.length ?? 0);
    const extent = tileExtent(tileRow, tileCol, tileWidth, tileHeight, tileSpacing, width, height);
    if (extent === undefined) {
        throw new Error(`Tile (${tileRow}, ${tileCol}) is outside the board.`);
    }
    const { r0, c0, r1, c1 } = extent;
    switch (corner) {
        case "nw": {
            const pt = polys[r0]![c0]!.points[0]!;
            return [pt.x, pt.y];
        }
        case "ne": {
            const pt = polys[r0]![c1]!.points[1]!;
            return [pt.x, pt.y];
        }
        case "sw": {
            const pt = polys[r1]![c0]!.points[3]!;
            return [pt.x, pt.y];
        }
        case "se": {
            const pt = polys[r1]![c1]!.points[2]!;
            return [pt.x, pt.y];
        }
    }
}

export function resolveSquareBoardPoint(
    point: SquarePoint,
    opts: ResolveSquarePointOpts,
): [number, number] {
    if (isTileCornerPoint(point)) {
        return tileCornerXY(
            opts.polys,
            point.tileRow,
            point.tileCol,
            point.corner,
            opts.tileWidth,
            opts.tileHeight,
            opts.tileSpacing,
            opts.boardWidth,
            opts.boardHeight,
        );
    }

    if (point.row === undefined || point.col === undefined) {
        throw new Error("Square board points require row/col or tileRow/tileCol/corner.");
    }

    return opts.interpolate({ row: point.row, col: point.col });
}
