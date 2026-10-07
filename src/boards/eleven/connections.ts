import { pullTowards } from "../../common/plotting.js";
import { findElevenReservedSpaces } from "../../common/eleven/reserved.js";
import type { ElevenTopology } from "../../common/eleven/types.js";
import { ELEVEN_DEFAULT_CONNECTION_BOW } from "./resolveOptions.js";

export type ElevenConnectionKind = "move" | "shoot";

const truncPath = (n: number): number => Math.round(n * 1000) / 1000;

const formatCoord = (n: number): string => {
    const t = truncPath(n);
    return Number.isInteger(t) ? String(t) : String(t);
};

export const sortUndirectedEdges = (edges: [number, number][]): [number, number][] =>
    [...edges]
        .map(([a, b]) => (a < b ? [a, b] : [b, a]) as [number, number])
        .sort((x, y) => x[0] - y[0] || x[1] - y[1]);

const trimOnRing = (
    from: { x: number; y: number; r: number },
    to: { x: number; y: number },
): { x: number; y: number } => pullTowards(from, to, from.r);

type Point = { x: number; y: number };

/** Linien hops may be stored end-to-end reversed; undirected keys always use lo → hi. */
export const orientEdgePolyline = (
    topology: ElevenTopology,
    lo: number,
    hi: number,
    pts: [number, number][],
): [number, number][] => {
    if (pts.length < 2) {
        return pts;
    }
    const sa = topology.spaces[lo];
    const sb = topology.spaces[hi];
    const p0 = pts[0];
    const pn = pts[pts.length - 1];
    const forward =
        Math.hypot(p0[0] - sa.x, p0[1] - sa.y) + Math.hypot(pn[0] - sb.x, pn[1] - sb.y);
    const backward =
        Math.hypot(p0[0] - sb.x, p0[1] - sb.y) + Math.hypot(pn[0] - sa.x, pn[1] - sa.y);
    if (backward < forward) {
        return [...pts].reverse();
    }
    return pts;
};

const edgePathKey = (lo: number, hi: number): string => `${lo}|${hi}`;

const lookupEdgePolyline = (
    topology: ElevenTopology,
    lo: number,
    hi: number,
    kind: ElevenConnectionKind,
): [number, number][] | undefined => {
    const paths = topology.edgePaths;
    if (paths === undefined) {
        return undefined;
    }
    const key = edgePathKey(lo, hi);
    const set = kind === "shoot" ? paths.shoot : paths.move;
    return set[key];
};

const centerSpot = (topology: ElevenTopology): { x: number; y: number } => {
    const spot = topology.markers.find((m) => m.kind === "centerSpot");
    if (spot === undefined) {
        throw new Error("eleven topology missing centerSpot");
    }
    return { x: spot.cx, y: spot.cy };
};

/** +1 / −1 = which side of the trimmed chord the reference Linien bulges toward (left normal). */
const referenceBulgeSign = (
    topology: ElevenTopology,
    lo: number,
    hi: number,
    kind: ElevenConnectionKind,
): number | undefined => {
    let poly = lookupEdgePolyline(topology, lo, hi, kind);
    if (poly === undefined && kind === "move") {
        poly = lookupEdgePolyline(topology, lo, hi, "shoot");
    }
    if (poly === undefined || poly.length < 2) {
        return undefined;
    }
    const sa = topology.spaces[lo];
    const sb = topology.spaces[hi];
    const p0 = trimOnRing(sa, sb);
    const p2 = trimOnRing(sb, sa);
    const dx = p2.x - p0.x;
    const dy = p2.y - p0.y;
    const chord = Math.hypot(dx, dy);
    if (chord < 1e-6) {
        return undefined;
    }
    const nx = -dy / chord;
    const ny = dx / chord;
    const midX = (p0.x + p2.x) / 2;
    const midY = (p0.y + p2.y) / 2;
    const oriented = orientEdgePolyline(topology, lo, hi, poly);
    let side = 0;
    for (let i = 1; i < oriented.length - 1; i++) {
        const pt = oriented[i]!;
        side += nx * (pt[0] - midX) + ny * (pt[1] - midY);
    }
    if (Math.abs(side) < 0.5) {
        return undefined;
    }
    return side > 0 ? 1 : -1;
};

const heuristicQuadPathD = (
    topology: ElevenTopology,
    lo: number,
    hi: number,
    signedBow: number,
    refBulgeSign: number | undefined,
): string => {
    const sa = topology.spaces[lo];
    const sb = topology.spaces[hi];
    const p0 = trimOnRing(sa, sb);
    const p2 = trimOnRing(sb, sa);

    const dx = p2.x - p0.x;
    const dy = p2.y - p0.y;
    const chord = Math.hypot(dx, dy);
    const maxR = Math.max(sa.r, sb.r);
    if (Math.abs(signedBow) <= 0 || chord < 2 * maxR) {
        return `M ${formatCoord(p0.x)} ${formatCoord(p0.y)} L ${formatCoord(p2.x)} ${formatCoord(p2.y)}`;
    }

    const midX = (p0.x + p2.x) / 2;
    const midY = (p0.y + p2.y) / 2;
    let nx = -dy / chord;
    let ny = dx / chord;

    let bulge: number;
    if (refBulgeSign !== undefined) {
        bulge = refBulgeSign * signedBow * chord;
    } else {
        const anchor = centerSpot(topology);
        const cross = nx * (anchor.x - midX) + ny * (anchor.y - midY);
        if (cross > 0) {
            nx = -nx;
            ny = -ny;
        }

        const reserved = findElevenReservedSpaces(topology);
        const shootAnchor =
            lo === reserved.westGoal || hi === reserved.westGoal
                ? { x: sa.x < sb.x ? sa.x - 200 : sb.x - 200, y: midY }
                : lo === reserved.eastGoal || hi === reserved.eastGoal
                  ? { x: sa.x > sb.x ? sa.x + 200 : sb.x + 200, y: midY }
                  : anchor;

        const crossShoot = nx * (shootAnchor.x - midX) + ny * (shootAnchor.y - midY);
        if (
            (lo === reserved.westGoal ||
                hi === reserved.westGoal ||
                lo === reserved.eastGoal ||
                hi === reserved.eastGoal) &&
            crossShoot > 0
        ) {
            nx = -nx;
            ny = -ny;
        }

        bulge = signedBow * chord;
    }

    const cap = chord * 0.3;
    if (Math.abs(bulge) > cap) {
        bulge = Math.sign(bulge) * cap;
    }
    const p1x = midX + nx * bulge;
    const p1y = midY + ny * bulge;

    return `M ${formatCoord(p0.x)} ${formatCoord(p0.y)} Q ${formatCoord(p1x)} ${formatCoord(p1y)} ${formatCoord(p2.x)} ${formatCoord(p2.y)}`;
};

const connectionClearance = 1.5;

const quadAt = (p0: Point, p1: Point, p2: Point, t: number): Point => {
    const u = 1 - t;
    return {
        x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
        y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
    };
};

const pathInvadesForeignSpace = (
    topology: ElevenTopology,
    lo: number,
    hi: number,
    p0: Point,
    p1: Point | null,
    p2: Point,
    clearance: number,
): boolean => {
    const steps = 32;
    for (let k = 0; k < topology.spaces.length; k++) {
        if (k === lo || k === hi) {
            continue;
        }
        const s = topology.spaces[k];
        const avoidR = s.r + clearance;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const pt =
                p1 === null
                    ? { x: p0.x + (p2.x - p0.x) * t, y: p0.y + (p2.y - p0.y) * t }
                    : quadAt(p0, p1, p2, t);
            if (Math.hypot(pt.x - s.x, pt.y - s.y) < avoidR) {
                return true;
            }
        }
    }
    return false;
};

/** Exported for tests: sample path must not enter unrelated Felder discs. */
export const elevenConnectionPathInvadesForeignSpace = (
    topology: ElevenTopology,
    lo: number,
    hi: number,
    d: string,
    clearance: number,
): boolean => {
    const sa = topology.spaces[lo];
    const sb = topology.spaces[hi];
    const p0 = trimOnRing(sa, sb);
    const p2 = trimOnRing(sb, sa);
    if (d.includes(" Q ")) {
        const parts = d.split(/[MQ ]+/).filter(Boolean);
        const p1 = { x: Number(parts[2]), y: Number(parts[3]) };
        return pathInvadesForeignSpace(topology, lo, hi, p0, p1, p2, clearance);
    }
    if (d.includes(" L ")) {
        const nums = d.replace(/M|L/g, " ").trim().split(/\s+/).map(Number);
        for (let i = 0; i + 3 < nums.length; i += 2) {
            const segA = { x: nums[i], y: nums[i + 1] };
            const segB = { x: nums[i + 2], y: nums[i + 3] };
            if (pathInvadesForeignSpace(topology, lo, hi, segA, null, segB, clearance)) {
                return true;
            }
        }
        for (let k = 0; k < topology.spaces.length; k++) {
            if (k === lo || k === hi) {
                continue;
            }
            const s = topology.spaces[k];
            const avoidR = s.r + clearance;
            for (let i = 0; i < nums.length; i += 2) {
                if (Math.hypot(nums[i] - s.x, nums[i + 1] - s.y) < avoidR) {
                    return true;
                }
            }
        }
        return false;
    }
    return pathInvadesForeignSpace(topology, lo, hi, p0, null, p2, clearance);
};

/** Procedural trimmed quadratic (or chord) between Felder rings — does not use extracted Linien samples. */
export const elevenConnectionPathD = (
    topology: ElevenTopology,
    connectionBow: number,
    a: number,
    b: number,
    kind: ElevenConnectionKind = "move",
): string => {
    const lo = a < b ? a : b;
    const hi = a < b ? b : a;

    const refSign = referenceBulgeSign(topology, lo, hi, kind);
    const tryBow = (signedBow: number): string =>
        heuristicQuadPathD(topology, lo, hi, signedBow, refSign);

    const bowMag = Math.abs(connectionBow);
    const candidates: string[] = [];
    if (bowMag > 0) {
        candidates.push(tryBow(bowMag));
    }
    candidates.push(tryBow(0));
    if (bowMag > 0) {
        candidates.push(tryBow(-bowMag));
    }

    for (const d of candidates) {
        if (!elevenConnectionPathInvadesForeignSpace(topology, lo, hi, d, connectionClearance)) {
            return d;
        }
    }
    return candidates[candidates.length - 1]!;
};

export const elevenConnectionPathBatch = (
    topology: ElevenTopology,
    connectionBow: number,
    edges: [number, number][],
    kind: ElevenConnectionKind = "move",
): string[] =>
    sortUndirectedEdges(edges).map(([ea, eb]) =>
        elevenConnectionPathD(topology, connectionBow, ea, eb, kind),
    );

export const elevenConnectionsFingerprint = (topology: ElevenTopology): string => {
    const bow = ELEVEN_DEFAULT_CONNECTION_BOW;
    const move = elevenConnectionPathBatch(topology, bow, topology.moveEdges, "move");
    const shoot = elevenConnectionPathBatch(topology, bow, topology.shootEdges, "shoot");
    return [...move, ...shoot].join("|");
};
