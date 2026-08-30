declare module "@turf/union" {
    import type { Feature, Polygon, MultiPolygon, Properties } from "geojson";
    function union(
        polygon1: Feature<Polygon | MultiPolygon, Properties>,
        polygon2: Feature<Polygon | MultiPolygon, Properties>,
    ): Feature<Polygon | MultiPolygon, Properties> | null;
    export default union;
}

declare module "@turf/helpers" {
    import type { Feature, LineString, Point, Polygon, Position, Properties, MultiPolygon } from "geojson";
    export type { Feature, LineString, Point, Polygon, Position, Properties, MultiPolygon };
    export function polygon(coordinates: Position[][]): Feature<Polygon>;
    export function lineString(coordinates: Position[]): Feature<LineString>;
}

declare module "monotone-chain-convex-hull" {
    function monotoneChainConvexHull(points: [number, number][]): [number, number][];
    export default monotoneChainConvexHull;
}
