import { hexOfCir } from "./hexOfCir";
import { hexOfHex } from "./hexOfHex";
import { hexOfTri } from "./hexOfTri";
import { hexSlanted } from "./hexSlanted";
import { rectOfRects } from "./rectOfRects";
import { snubsquare } from "./snubsquare";
import { cobweb } from "./cobweb";
import { wheel } from "./wheel";
import { cairo } from "./cairo";
import { pentagonal } from "./pentagonal";
import { conicalHex, genPolys as genConicalHexPolys } from "./conicalHex";
import { pyramidHex, genPolys as genPyramidHexPolys } from "./pyramidHex";

import { GridPoints, IPoint, Poly, IPolyCircle, IPolyPath, IPolyPolygon, type SnubStart, type PentagonOrientation } from "./_base";
import { deg2rad } from "../common/plotting";

export {type GridPoints, type IPoint, hexOfCir, hexOfHex, hexOfTri, hexSlanted, rectOfRects, snubsquare, pentagonal, cobweb, wheel, cairo, conicalHex, genConicalHexPolys, pyramidHex, genPyramidHexPolys, type Poly, type IPolyCircle, type IPolyPath, type IPolyPolygon, SnubStart, PentagonOrientation};

export const rotateGrid = (grid: GridPoints, deg: number, cx: number, cy: number): GridPoints => {
    const rad = deg2rad(deg);
    return grid.map(row => row.map(pt => {
        return {
            x: ((pt.x - cx) * Math.cos(rad)) - ((pt.y - cy) * Math.sin(rad)) + cx,
            y: ((pt.y - cy) * Math.cos(rad)) + ((pt.x - cx) * Math.sin(rad)) + cy,
        }
    }));
}
