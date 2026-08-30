import { hexOfCir } from "./hexOfCir.js";
import { hexOfHex } from "./hexOfHex.js";
import { hexOfTri } from "./hexOfTri.js";
import { hexSlanted } from "./hexSlanted.js";
import { rectOfRects } from "./rectOfRects.js";
import { expandSquareGrid } from "./expandSquareGrid.js";
import { resolveSquareBoardPoint, tileCornerXY, isTileCornerPoint, type SquarePoint } from "./resolveSquarePoint.js";
import { snubsquare } from "./snubsquare.js";
import { cobweb } from "./cobweb.js";
import { wheel } from "./wheel.js";
import { cairo } from "./cairo.js";
import { pentagonal } from "./pentagonal.js";
import { bentTri } from "./bentTri.js";
import { star } from "./star.js";
import { conicalHex, genPolys as genConicalHexPolys } from "./conicalHex.js";
import { pyramidHex, genPolys as genPyramidHexPolys } from "./pyramidHex.js";
export { mancalaRound, type IMancalaRoundArgs } from "./mancalaRound.js";

import { GridPoints, IPoint, Poly, IPolyCircle, IPolyPath, IPolyPolygon, type SnubStart, type PentagonOrientation } from "./_base.js";
import { deg2rad } from "../common/plotting.js";

export {type GridPoints, type IPoint, hexOfCir, hexOfHex, hexOfTri, hexSlanted, rectOfRects, expandSquareGrid, resolveSquareBoardPoint, tileCornerXY, isTileCornerPoint, type SquarePoint, snubsquare, pentagonal, bentTri, star, cobweb, wheel, cairo, conicalHex, genConicalHexPolys, pyramidHex, genPyramidHexPolys, type Poly, type IPolyCircle, type IPolyPath, type IPolyPolygon, SnubStart, PentagonOrientation};

export const rotateGrid = (grid: GridPoints, deg: number, cx: number, cy: number): GridPoints => {
    const rad = deg2rad(deg);
    return grid.map(row => row.map(pt => {
        return {
            x: ((pt.x - cx) * Math.cos(rad)) - ((pt.y - cy) * Math.sin(rad)) + cx,
            y: ((pt.y - cy) * Math.cos(rad)) + ((pt.x - cx) * Math.sin(rad)) + cy,
        }
    }));
}
