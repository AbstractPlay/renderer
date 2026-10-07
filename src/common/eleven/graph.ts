import { buildElevenPitchIds } from "./pitchId.js";
import type { ElevenGraphHelpers, ElevenTopology } from "./types.js";

const adjacencyFromEdges = (n: number, edges: [number, number][]): Map<number, number[]> => {
    const adj = new Map<number, number[]>();
    for (let i = 0; i < n; i++) {
        adj.set(i, []);
    }
    for (const [a, b] of edges) {
        adj.get(a)!.push(b);
        adj.get(b)!.push(a);
    }
    for (const [i, list] of adj) {
        list.sort((x, y) => x - y);
        adj.set(i, list);
    }
    return adj;
};

export const buildElevenGraphHelpers = (topology: ElevenTopology): ElevenGraphHelpers => {
    const spaces = buildElevenPitchIds(topology);
    const pitchIdByIndex = new Map<number, string>();
    const indexByPitchId = new Map<string, number>();
    for (const s of spaces) {
        pitchIdByIndex.set(s.index, s.pitchId);
        if (indexByPitchId.has(s.pitchId)) {
            throw new Error(`duplicate pitch id ${s.pitchId}`);
        }
        indexByPitchId.set(s.pitchId, s.index);
    }

    const n = topology.spaces.length;
    return {
        topology,
        spaces,
        pitchIdByIndex,
        indexByPitchId,
        moveNeighbors: adjacencyFromEdges(n, topology.moveEdges),
        shootNeighbors: adjacencyFromEdges(n, topology.shootEdges),
    };
};

export const elevenPitchId = (helpers: ElevenGraphHelpers, index: number): string => {
    const id = helpers.pitchIdByIndex.get(index);
    if (id === undefined) {
        throw new Error(`no eleven space at index ${index}`);
    }
    return id;
};

export const elevenIndexFromPitchId = (helpers: ElevenGraphHelpers, pitchId: string): number => {
    const index = helpers.indexByPitchId.get(pitchId);
    if (index === undefined) {
        throw new Error(`unknown eleven pitch id ${pitchId}`);
    }
    return index;
};
