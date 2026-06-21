import { Graph } from "./Graph";
import { type Point, overlapRowsFor } from "./lattice";

export type BentGeometryOptions = {
    /** Outward bow strength in 0–1 (0 = flat). */
    bow?: number;
};

const parseRef = (ref: string): { copy: number; row: number; col: number } => {
    const [copy, row, col] = ref.split(",").map(Number);
    return { copy, row, col };
};

const vidAt = (graph: Graph, copy: number, row: number, col: number): number | undefined =>
    graph.refToVid.get(`${copy},${row},${col}`);

const dist = (a: Point, b: Point): number => Math.hypot(b.x - a.x, b.y - a.y);

/** Vertices inside the overlap cap on any copy. */
export const buildCapIds = (graph: Graph): Set<number> => {
    const overlapRows = graph.overlapRows;
    const cap = new Set<number>();
    for (const [ref, vid] of graph.refToVid) {
        const { row } = parseRef(ref);
        if (row < overlapRows) {
            cap.add(vid);
        }
    }
    return cap;
};

/** Quadratic bezier bowed outward (away from the reference point). */
const arcPoint = (
    a: Point,
    b: Point,
    t: number,
    bowAmt: number,
    outwardRef: Point,
): Point => {
    const lerp = (p: Point, q: Point, s: number): Point => ({
        x: p.x + (q.x - p.x) * s,
        y: p.y + (q.y - p.y) * s,
    });
    if (bowAmt <= 0) {
        return lerp(a, b, t);
    }
    const mid = lerp(a, b, 0.5);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    if (len < 1e-9) {
        return { x: a.x, y: a.y };
    }
    let nx = -dy / len;
    let ny = dx / len;
    const toRefX = outwardRef.x - mid.x;
    const toRefY = outwardRef.y - mid.y;
    if (nx * toRefX + ny * toRefY > 0) {
        nx = -nx;
        ny = -ny;
    }
    const ctrl = {
        x: mid.x + nx * bowAmt * len,
        y: mid.y + ny * bowAmt * len,
    };
    const s = 1 - t;
    return {
        x: s * s * a.x + 2 * s * t * ctrl.x + t * t * b.x,
        y: s * s * a.y + 2 * s * t * ctrl.y + t * t * b.y,
    };
};

const arcEqualPoints = (
    a: Point,
    b: Point,
    count: number,
    bowAmt: number,
    outwardRef: Point,
): Point[] => {
    if (count < 1) {
        return [];
    }
    if (count === 1) {
        return [{ x: a.x, y: a.y }];
    }
    if (bowAmt <= 0) {
        return Array.from({ length: count }, (_, i) => ({
            x: a.x + ((b.x - a.x) * i) / (count - 1),
            y: a.y + ((b.y - a.y) * i) / (count - 1),
        }));
    }

    const samples = 128;
    const cum: number[] = [0];
    let prev = a;
    for (let i = 1; i <= samples; i++) {
        const t = i / samples;
        const p = arcPoint(a, b, t, bowAmt, outwardRef);
        cum.push(cum[i - 1]! + dist(prev, p));
        prev = p;
    }
    const total = cum[samples]!;
    if (total < 1e-9) {
        return Array.from({ length: count }, () => ({ x: a.x, y: a.y }));
    }

    const result: Point[] = [];
    for (let j = 0; j < count; j++) {
        const target = (j / (count - 1)) * total;
        let lo = 0;
        let hi = samples;
        while (lo + 1 < hi) {
            const mid = (lo + hi) >> 1;
            if (cum[mid]! < target) {
                lo = mid;
            } else {
                hi = mid;
            }
        }
        const span = cum[lo + 1]! - cum[lo]!;
        const frac = span < 1e-9 ? 0 : (target - cum[lo]!) / span;
        const t = (lo + frac) / samples;
        result.push(arcPoint(a, b, t, bowAmt, outwardRef));
    }
    return result;
};

type RayKind = "right" | "bottom" | "left" | "hub";

type BowChain = {
    chain: number[];
    depth: number;
    kind: RayKind;
};

/**
 * Perimeter bow rays for one grid ring — mirrors Graph.buildGridLayers but
 * splits into three bowed chains (right wing, bottom, left wing).
 */
const buildRingRays = (
    graph: Graph,
    n: number,
    gr: number,
    rings: number,
    overlapRows: number,
): number[][] => {
    const push = (chain: number[], id: number | undefined): void => {
        if (id !== undefined) {
            chain.push(id);
        }
    };

    if (gr === rings) {
        const rightRay: number[] = [];
        push(rightRay, vidAt(graph, 0, 0, 0));
        for (let row = 1; row < gr; row++) {
            push(rightRay, vidAt(graph, 0, row, 0));
        }
        push(rightRay, vidAt(graph, 0, gr, 0));

        const bottomRay: number[] = [];
        for (let col = 0; col <= gr; col++) {
            push(bottomRay, vidAt(graph, 0, gr, col));
        }

        const leftRay: number[] = [];
        push(leftRay, vidAt(graph, 0, gr, gr));
        for (let row = gr - 1; row >= 1; row--) {
            push(leftRay, vidAt(graph, 0, row, row));
        }
        push(leftRay, vidAt(graph, 0, 0, 0));

        return [rightRay, bottomRay, leftRay];
    }

    const baseRow = n - gr;

    const rightRay: number[] = [];
    push(rightRay, vidAt(graph, 1, gr, gr));
    for (let row = gr + 1; row <= n - 1; row++) {
        push(rightRay, vidAt(graph, 1, row, gr));
    }
    push(rightRay, vidAt(graph, 0, baseRow, 0));

    const bottomRay: number[] = [];
    if (baseRow >= overlapRows) {
        for (let col = 0; col <= baseRow; col++) {
            push(bottomRay, vidAt(graph, 0, baseRow, col));
        }
    }

    const leftRay: number[] = [];
    const blId = vidAt(graph, 0, baseRow, baseRow);
    push(leftRay, blId);
    for (let row = n - 1; row >= gr + 1; row--) {
        const id = vidAt(graph, 2, row, row - gr);
        if (id !== undefined && id !== blId) {
            leftRay.push(id);
        }
    }
    push(leftRay, vidAt(graph, 1, gr, gr));

    return [rightRay, bottomRay, leftRay];
};

/** Bow chains along grid ring perimeter rays, outer rings first. */
export const buildBowChains = (graph: Graph, n: number): BowChain[] => {
    const overlapRows = overlapRowsFor(n);
    const rings = Math.ceil(n / 2);
    const chains: BowChain[] = [];
    const kinds: RayKind[] = ["right", "bottom", "left"];

    for (let gr = 0; gr <= rings; gr++) {
        const depth = rings - gr;
        const rays = buildRingRays(graph, n, gr, rings, overlapRows);
        for (let i = 0; i < rays.length; i++) {
            const chain = rays[i]!;
            if (chain.length >= 2) {
                chains.push({ chain, depth, kind: kinds[i]! });
            }
        }
    }

    return chains;
};

type HubLayer = {
    corners: [number, number, number];
    edges: [number[], number[], number[]];
};

const chainCopy0Col = (
    graph: Graph,
    col: number,
    rowStart: number,
    rowEnd: number,
): number[] => {
    const chain: number[] = [];
    for (let row = rowStart; row <= rowEnd; row++) {
        const id = vidAt(graph, 0, row, col);
        if (id !== undefined) {
            chain.push(id);
        }
    }
    return chain;
};

const chainCopy0Row = (
    graph: Graph,
    row: number,
    colStart: number,
    colEnd: number,
): number[] => {
    const chain: number[] = [];
    for (let col = colStart; col <= colEnd; col++) {
        const id = vidAt(graph, 0, row, col);
        if (id !== undefined) {
            chain.push(id);
        }
    }
    return chain;
};

const chainCopy0Diag = (
    graph: Graph,
    rowStart: number,
    colStart: number,
    rowEnd: number,
): number[] => {
    const chain: number[] = [];
    const steps = rowEnd - rowStart;
    for (let i = 0; i <= steps; i++) {
        const id = vidAt(graph, 0, rowStart + i, colStart + i);
        if (id !== undefined) {
            chain.push(id);
        }
    }
    return chain;
};

/**
 * Concentric hub triangles on copy-0 inside the overlap cap.
 * Each layer has three fixed corners; interiors along each edge are bowed.
 */
const buildHubLayers = (graph: Graph, n: number): HubLayer[] => {
    const overlapRows = overlapRowsFor(n);
    const layers: HubLayer[] = [];
    let spineCol = 1;
    let bottomRow = overlapRows - 2;

    while (true) {
        const topRow = 2 * spineCol;
        if (topRow >= bottomRow) {
            break;
        }

        const top = vidAt(graph, 0, topRow, spineCol);
        const bl = vidAt(graph, 0, bottomRow, spineCol);
        const br = vidAt(graph, 0, bottomRow, bottomRow - spineCol);
        if (top === undefined || bl === undefined || br === undefined) {
            break;
        }

        layers.push({
            corners: [top, bl, br],
            edges: [
                chainCopy0Col(graph, spineCol, topRow, bottomRow),
                chainCopy0Row(graph, bottomRow, spineCol, bottomRow - spineCol),
                chainCopy0Diag(graph, topRow, spineCol, bottomRow),
            ],
        });

        spineCol++;
        bottomRow--;
    }

    return layers;
};

const isTopSeamWeld = (graph: Graph, id: number, n: number): boolean => {
    const k = Math.floor(n / 2);
    for (const [ref, vid] of graph.refToVid) {
        if (vid !== id) {
            continue;
        }
        const { copy, row, col } = parseRef(ref);
        if (copy === 1 && row === col && row >= 1 && row <= k) {
            return true;
        }
        if (copy === 2 && col === 0 && row >= 1 && row <= k) {
            return true;
        }
    }
    return false;
};

const capBowRef = (
    graph: Graph,
    flat: Map<number, Point>,
    hub: Point,
    overlapRows: number,
): Point => {
    let maxY = hub.y;
    for (let row = 0; row < overlapRows; row++) {
        for (let col = 0; col <= row; col++) {
            const id = vidAt(graph, 0, row, col);
            if (id === undefined) {
                continue;
            }
            const p = flat.get(id)!;
            maxY = Math.max(maxY, p.y);
        }
    }
    const span = maxY - hub.y || 50;
    return { x: hub.x, y: maxY + span };
};

const isCopy0CapVertex = (
    graph: Graph,
    id: number,
    overlapRows: number,
): boolean => {
    for (const [ref, vid] of graph.refToVid) {
        if (vid !== id) {
            continue;
        }
        const { copy, row } = parseRef(ref);
        if (copy === 0 && row < overlapRows) {
            return true;
        }
    }
    return false;
};

/** Ray endpoints plus structural weld anchors. */
export const buildFixedIds = (graph: Graph, n: number): Set<number> => {
    const overlapRows = overlapRowsFor(n);
    const fixed = new Set<number>();

    const apex = vidAt(graph, 1, 0, 0) ?? vidAt(graph, 0, 0, 0);
    const hub = vidAt(graph, 0, 0, 0);
    const bl = vidAt(graph, 0, n, n);
    const br = vidAt(graph, 0, n, 0);
    if (apex !== undefined) {
        fixed.add(apex);
    }
    if (hub !== undefined) {
        fixed.add(hub);
    }
    if (bl !== undefined) {
        fixed.add(bl);
    }
    if (br !== undefined) {
        fixed.add(br);
    }

    // Hub-ring corners on copy-0 (cap row spine corners).
    const rings = Math.ceil(n / 2);
    const hubRight = vidAt(graph, 0, rings, 0);
    const hubLeft = vidAt(graph, 0, rings, rings);
    if (hubRight !== undefined) {
        fixed.add(hubRight);
    }
    if (hubLeft !== undefined) {
        fixed.add(hubLeft);
    }

    // Top-seam welds stay on the hub axis; only wing interiors bow along rays.
    for (const vertex of graph.vertices) {
        if (isTopSeamWeld(graph, vertex.id, n)) {
            fixed.add(vertex.id);
        }
    }

    for (const { chain } of buildBowChains(graph, n)) {
        for (const endpoint of [chain[0]!, chain[chain.length - 1]!]) {
            if (endpoint === hub || endpoint === apex) {
                continue;
            }
            if (isCopy0CapVertex(graph, endpoint, overlapRows)) {
                continue;
            }
            if (isTopSeamWeld(graph, endpoint, n)) {
                continue;
            }
            fixed.add(endpoint);
        }
    }

    for (const [ref, vid] of graph.refToVid) {
        const { copy, row, col } = parseRef(ref);
        if (copy === 0 && row >= overlapRows && (col === 0 || col === row)) {
            fixed.add(vid);
        }
    }

    return fixed;
};

const extendArcEndpoint = (
    flatEnd: Point,
    flatOther: Point,
    bowAmt: number,
    outwardRef: Point,
): Point => {
    if (bowAmt <= 0) {
        return flatEnd;
    }
    const mid = {
        x: (flatEnd.x + flatOther.x) / 2,
        y: (flatEnd.y + flatOther.y) / 2,
    };
    const arcMid = arcPoint(flatOther, flatEnd, 0.5, bowAmt, outwardRef);
    return {
        x: flatEnd.x + (arcMid.x - mid.x),
        y: flatEnd.y + (arcMid.y - mid.y),
    };
};

const distributeOnArcEqual = (
    positions: Map<number, Point>,
    flat: Map<number, Point>,
    chain: number[],
    bowAmt: number,
    outwardRef: Point,
    fixedIds: Set<number>,
    placed: Set<number>,
): void => {
    if (chain.length < 2) {
        return;
    }
    const flatStart = flat.get(chain[0]!)!;
    const flatEnd = flat.get(chain[chain.length - 1]!)!;
    const bowStart = fixedIds.has(chain[0]!)
        ? flatStart
        : positions.get(chain[0]!) ?? flatStart;
    const endForArc = fixedIds.has(chain[chain.length - 1]!)
        ? flatEnd
        : extendArcEndpoint(flatEnd, flatStart, bowAmt, outwardRef);
    const pts = arcEqualPoints(bowStart, endForArc, chain.length, bowAmt, outwardRef);

    for (let i = 0; i < chain.length; i++) {
        const id = chain[i]!;
        if (fixedIds.has(id)) {
            continue;
        }
        positions.set(id, pts[i]!);
        placed.add(id);
    }
};

const bowRayChain = (
    positions: Map<number, Point>,
    flat: Map<number, Point>,
    chain: number[],
    bowAmt: number,
    outwardRef: Point,
    fixedIds: Set<number>,
    placed: Set<number>,
): void => {
    distributeOnArcEqual(
        positions,
        flat,
        chain,
        bowAmt,
        outwardRef,
        fixedIds,
        placed,
    );
};

const assertFixedUnmoved = (
    flat: Map<number, Point>,
    positions: Map<number, Point>,
    fixedIds: Set<number>,
): void => {
    for (const id of fixedIds) {
        const f = flat.get(id);
        const p = positions.get(id);
        if (f === undefined || p === undefined) {
            continue;
        }
        const d = Math.hypot(p.x - f.x, p.y - f.y);
        if (d > 1e-6) {
            throw new Error(`Fixed vertex ${id} moved by ${d} during bowing`);
        }
    }
};

/**
 * Bow the board along grid ring perimeter rays with equal arc spacing.
 */
export const computeBentPositions = (
    graph: Graph,
    opts?: BentGeometryOptions,
): Map<number, Point> => {
    const bow = opts?.bow ?? 0.35;
    const n = graph.frequency;
    const overlapRows = overlapRowsFor(n);

    const flat = new Map<number, Point>();
    for (const vertex of graph.vertices) {
        flat.set(vertex.id, { x: vertex.pt!.x, y: vertex.pt!.y });
    }

    if (bow <= 0) {
        return flat;
    }

    const fixedIds = buildFixedIds(graph, n);
    const positions = new Map(flat);
    const placed = new Set<number>();

    const topId = vidAt(graph, 1, 0, 0) ?? vidAt(graph, 0, 0, 0)!;
    const blId = vidAt(graph, 0, n, n)!;
    const brId = vidAt(graph, 0, n, 0)!;
    const hubId = vidAt(graph, 0, 0, 0)!;
    const top = flat.get(topId)!;
    const bl = flat.get(blId)!;
    const br = flat.get(brId)!;
    const hub = flat.get(hubId)!;
    const centroid: Point = {
        x: (top.x + bl.x + br.x) / 3,
        y: (top.y + bl.y + br.y) / 3,
    };

    const chains = buildBowChains(graph, n);
    const hubLayers = buildHubLayers(graph, n);
    const maxDepth = Math.max(...chains.map(c => c.depth), 1);
    chains.sort((a, b) => b.depth - a.depth || b.chain.length - a.chain.length);

    const capRef = capBowRef(graph, flat, hub, overlapRows);
    const hubBowAmt = bow * 0.55;

    for (const { chain, depth, kind } of chains) {
        // Hub and inner rings still need visible bow; outer rings bow most.
        const ringT = depth / maxDepth;
        const bowAmt = bow * (0.55 + 0.45 * ringT);
        // Bottom rows bow outward from the board centroid (down). Cap wings
        // bow upward from a reference below the cap.
        const outwardRef =
            kind === "bottom"
                ? centroid
                : depth < maxDepth
                  ? capRef
                  : centroid;
        bowRayChain(
            positions,
            flat,
            chain,
            bowAmt,
            outwardRef,
            fixedIds,
            placed,
        );
    }

    for (const { corners, edges } of hubLayers) {
        const layerFixed = new Set(fixedIds);
        for (const id of corners) {
            layerFixed.add(id);
        }
        const [spine, bottom, diagonal] = edges;
        const hubEdges: { chain: number[]; outwardRef: Point }[] = [
            { chain: spine, outwardRef: capRef },
            { chain: bottom, outwardRef: centroid },
            { chain: diagonal, outwardRef: capRef },
        ];
        for (const { chain, outwardRef } of hubEdges) {
            if (chain.length < 2) {
                continue;
            }
            bowRayChain(
                positions,
                flat,
                chain,
                hubBowAmt,
                outwardRef,
                layerFixed,
                placed,
            );
        }
    }

    assertFixedUnmoved(flat, positions, fixedIds);

    return positions;
};
