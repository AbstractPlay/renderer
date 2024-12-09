import { Poly } from "../grids";
import { circle2poly } from "./plotting";
import turfUnion from "@turf/union";
import { polygon as turfPoly, Properties, Feature, Polygon, MultiPolygon } from "@turf/helpers";
import getConvexHull from "monotone-chain-convex-hull";

export const unionPolys = (polys: Poly[]): [number,number][] => {
    const turfed = polys.flat().map(p => {
        let pts: [number,number][];
        if (p.type === "circle") {
            pts = circle2poly(p.cx, p.cy, p.r);
        } else {
            pts = [...p.points.map(pt => [pt.x, pt.y] as [number,number])];
        }
        if (pts[0] !== pts[pts.length - 1]) {
            pts.push(pts[0])
        }
        return turfPoly([pts]);
    });
    let union: Feature<Polygon|MultiPolygon, Properties>|null = turfed.pop()!;
    while (turfed.length > 0) {
        const next = turfed.pop()! as Feature<Polygon|MultiPolygon, Properties>;
        union = turfUnion(union, next);
        if (union === null) {
            throw new Error(`Got null while joining polygons in backFill()`);
        }
    }
    return union.geometry.coordinates[0] as [number,number][];
}

export const convexHullPolys = (polys: Poly[]): [number,number][] => {
    const allPts: [number,number][] = polys.flat().map(p => {
        let pts: [number,number][];
        if (p.type === "circle") {
            pts = circle2poly(p.cx, p.cy, p.r);
        } else {
            pts = [...p.points.map(pt => [pt.x, pt.y] as [number,number])];
        }
        return pts;
    }).flat();
    return getConvexHull(allPts);
}
