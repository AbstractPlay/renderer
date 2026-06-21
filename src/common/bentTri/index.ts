/**
 * Bent equilateral-triangle board.
 *
 * ## Build algorithm
 *
 * 1. Generate a triangular lattice of frequency n (apex at the origin).
 * 2. Note left (col = row) and right (col = 0) sides.
 * 3. Compute overlap cap size: `overlapRows = ceil(n/2) + 1`.
 * 4. Create two wing copies, rotated ±120° and translated so their caps
 *    overlap the base cap (implemented as translations — see lattice.ts).
 * 5. Merge coincident cap vertices (position welding); these never move.
 * 6. For each row below the cap, merge wing edge pairs at midpoints.
 * 7. Push cap vertices from the hub and exterior vertices from the centroid (bendGeometry.ts).
 * 8. Expose grid rings outside-in, clockwise from the north apex (gridLayers).
 */

import { Graph, type BentTriOptions } from "./Graph";
import { Vertex } from "./Vertex";
import { Edge } from "./Edge";
import { computeBentPositions, type BentGeometryOptions } from "./bendGeometry";
import { overlapRowsFor } from "./lattice";

export { Vertex, Edge, Graph, computeBentPositions, overlapRowsFor };
export type { BentTriOptions, BentGeometryOptions };

export const bentTriBoard = (frequency: number, opts?: BentTriOptions): Graph => {
    return new Graph(frequency, opts);
};
