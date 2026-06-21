import { GridPoints, IGeneratorArgs, IPoint } from "./_base";
import { computeBentPositions, Graph as BentTriGraph } from "../common/bentTri";
import { centroid, pullTowards } from "../common/plotting";

export type BentTriGridResult = {
    grid: GridPoints;
    /** Bent x,y for each graph vertex id (used by the graph renderer). */
    positions: Map<number, IPoint>;
};

/** Matches computeBentPositions when bow is omitted from generator args. */
const DEFAULT_BOW = 0.35;

/** Grid layer index of the first ring inside the cap hub shell. */
const firstInsideHubLayerIndex = (graph: BentTriGraph): number => {
    const overlapRows = graph.overlapRows;
    const spineCol = 1;
    const bottomRow = overlapRows - 2;
    const topRow = 2 * spineCol;
    const cornerIds = new Set(
        [
            graph.refToVid.get(`0,${topRow},${spineCol}`),
            graph.refToVid.get(`0,${bottomRow},${spineCol}`),
            graph.refToVid.get(`0,${bottomRow},${bottomRow - spineCol}`),
        ].filter((id): id is number => id !== undefined),
    );

    for (let i = 0; i < graph.gridLayers.length; i++) {
        if (graph.gridLayers[i]!.some(vertex => cornerIds.has(vertex.id))) {
            return i;
        }
    }
    return graph.gridLayers.length - 1;
};

const boardCentroidFromGrid = (grid: GridPoints): IPoint => {
    const lastRow = grid.at(-1);
    if (lastRow === undefined || lastRow.length === 0) {
        return { x: 0, y: 0 };
    }
    if (lastRow.length === 1) {
        return lastRow[0]!;
    }
    return centroid(lastRow) ?? { x: 0, y: 0 };
};

const distBetween = (
    positions: Map<number, IPoint>,
    a: number,
    b: number,
): number => {
    const p = positions.get(a);
    const q = positions.get(b);
    if (p === undefined || q === undefined) {
        return 0;
    }
    return Math.hypot(q.x - p.x, q.y - p.y);
};

/**
 * Cross-layer reference on the cap spine: outer-ring vtx (e.g. 5) and its
 * inner-ring neighbour (e.g. 4) across the boundary between two grid layers.
 */
const boundaryGapReference = (
    graph: BentTriGraph,
    outerIdx: number,
    innerIdx: number,
): { outerId: number; innerId: number } | undefined => {
    const spineCol = 1;
    const topRow = 2 * spineCol;
    const insideId = graph.refToVid.get(`0,${topRow},${spineCol}`);
    const outerId = graph.refToVid.get(`0,${topRow},${spineCol + 1}`);
    const outerIds = new Set(graph.gridLayers[outerIdx]!.map(vertex => vertex.id));
    if (
        insideId !== undefined
        && outerId !== undefined
        && graph.gridLayers[innerIdx]!.some(vertex => vertex.id === insideId)
        && outerIds.has(outerId)
    ) {
        return { outerId, innerId: insideId };
    }

    for (const vertex of graph.gridLayers[innerIdx]!) {
        for (const nbor of graph.vertices[vertex.id]!.nbors) {
            if (outerIds.has(nbor)) {
                return { outerId: nbor, innerId: vertex.id };
            }
        }
    }
    return undefined;
};

/** Typical interior step from a ring vtx to the next ring out (e.g. 5→85 at n=8). */
const ringInteriorStep = (
    graph: BentTriGraph,
    positions: Map<number, IPoint>,
    ringIdx: number,
    vtxId: number,
): number | undefined => {
    if (ringIdx <= 0) {
        return undefined;
    }
    const outerIds = new Set(graph.gridLayers[ringIdx - 1]!.map(vertex => vertex.id));
    const steps: number[] = [];
    for (const nbor of graph.vertices[vtxId]!.nbors) {
        if (outerIds.has(nbor)) {
            steps.push(distBetween(positions, vtxId, nbor));
        }
    }
    if (steps.length === 0) {
        return undefined;
    }
    return steps.reduce((sum, step) => sum + step, 0) / steps.length;
};

const pullLayersTrial = (
    grid: GridPoints,
    graph: BentTriGraph,
    positions: Map<number, IPoint>,
    outerStart: number,
    outerEnd: number,
    boardCentroid: IPoint,
    pullDist: number,
): Map<number, IPoint> => {
    const trial = new Map(positions);
    for (let layerIdx = outerStart; layerIdx <= outerEnd; layerIdx++) {
        for (let ptIdx = 0; ptIdx < grid[layerIdx]!.length; ptIdx++) {
            const vertex = graph.gridLayers[layerIdx]![ptIdx]!;
            const pt = grid[layerIdx]![ptIdx]!;
            trial.set(vertex.id, pullTowards(pt, boardCentroid, pullDist));
        }
    }
    return trial;
};

/** Pull distance for one compression step that closes the boundary gap without over-pulling. */
const stepPullDistance = (
    grid: GridPoints,
    graph: BentTriGraph,
    positions: Map<number, IPoint>,
    outerStart: number,
    outerEnd: number,
    innerIdx: number,
    boardCentroid: IPoint,
): number => {
    const gap = boundaryGapReference(graph, outerEnd, innerIdx);
    if (gap === undefined) {
        return 0;
    }

    const initialGap = distBetween(positions, gap.outerId, gap.innerId);
    const initialStep = ringInteriorStep(graph, positions, outerEnd, gap.outerId);
    if (initialStep === undefined || initialGap <= initialStep) {
        return 0;
    }

    const mismatch = (pullDist: number): number => {
        const trial = pullLayersTrial(
            grid,
            graph,
            positions,
            outerStart,
            outerEnd,
            boardCentroid,
            pullDist,
        );
        const gapAfter = distBetween(trial, gap.outerId, gap.innerId);
        const stepAfter = ringInteriorStep(graph, trial, outerEnd, gap.outerId);
        if (stepAfter === undefined) {
            return Number.POSITIVE_INFINITY;
        }
        return Math.abs(gapAfter - stepAfter);
    };

    let lo = 0;
    let hi = initialGap;
    for (let i = 0; i < 64; i++) {
        const third = (hi - lo) / 3;
        const m1 = lo + third;
        const m2 = hi - third;
        if (mismatch(m1) < mismatch(m2)) {
            hi = m2;
        } else {
            lo = m1;
        }
    }
    return (lo + hi) / 2;
};

const applyPullToLayers = (
    grid: GridPoints,
    graph: BentTriGraph,
    positions: Map<number, IPoint>,
    outerStart: number,
    outerEnd: number,
    boardCentroid: IPoint,
    pullDist: number,
): void => {
    for (let layerIdx = outerStart; layerIdx <= outerEnd; layerIdx++) {
        const layer = graph.gridLayers[layerIdx]!;
        for (let ptIdx = 0; ptIdx < grid[layerIdx]!.length; ptIdx++) {
            const pulled = pullTowards(grid[layerIdx]![ptIdx]!, boardCentroid, pullDist);
            grid[layerIdx]![ptIdx] = pulled;
            positions.set(layer[ptIdx]!.id, pulled);
        }
    }
};

/**
 * Close hub overlap gaps left by bowing. Walk inside grid layers from the first
 * ring inside the cap hub shell inward; at each step hold that shell and
 * everything deeper fixed, and pull every ring outside it toward the board core.
 */
const closeHubGaps = (
    grid: GridPoints,
    graph: BentTriGraph,
    positions: Map<number, IPoint>,
    boardCentroid: IPoint,
): void => {
    const insideStart = firstInsideHubLayerIndex(graph);
    const insideEnd = grid.length - 1;
    if (insideStart > insideEnd) {
        return;
    }

    for (let i = insideStart; i <= insideEnd; i++) {
        const outerEnd = i - 1;
        // First step pulls the hub shell and everything outside it. Later steps
        // pull only the ring that just became exterior so outer layers are not
        // collapsed again while the fixed inner shell advances.
        const outerStart = i === insideStart ? 0 : outerEnd;
        const pullDist = stepPullDistance(
            grid,
            graph,
            positions,
            outerStart,
            outerEnd,
            i,
            boardCentroid,
        );
        if (pullDist <= 0) {
            continue;
        }
        applyPullToLayers(
            grid,
            graph,
            positions,
            outerStart,
            outerEnd,
            boardCentroid,
            pullDist,
        );
    }
};

/**
 * Playable vertex positions for a bent equilateral triangle board.
 * Layers run outside-in: perimeter rings (copy-1 spine, copy-0 base, copy-2 hypotenuse)
 * and an innermost copy-0 hub triangle.
 * Bending is applied here — the graph keeps flat topology coordinates.
 */
export const bentTri = (args: IGeneratorArgs): BentTriGridResult => {
    if (args.bentTriGraph === undefined) {
        throw new Error(`The bentTri grid generator requires the "bentTriGraph" parameter.`);
    }

    const bow = args.bow ?? DEFAULT_BOW;
    const positions = computeBentPositions(args.bentTriGraph, { bow });

    const grid: GridPoints = [];
    for (const layer of args.bentTriGraph.gridLayers) {
        const row: IPoint[] = [];
        for (const vertex of layer) {
            const pt = positions.get(vertex.id);
            if (pt === undefined) {
                throw new Error(`Missing bent position for vertex ${vertex.id}`);
            }
            row.push(pt);
        }
        grid.push(row);
    }

    const shouldCloseHubGaps = args.closeHubGaps ?? true;
    if (bow > 0 && shouldCloseHubGaps) {
        closeHubGaps(
            grid,
            args.bentTriGraph,
            positions,
            boardCentroidFromGrid(grid),
        );
    }

    return { grid, positions };
};

export type { BentTriGraph };
